import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import Loader from "../components/Loader";
import Player from "../components/Player";
import Episodes from "../layouts/Episodes";
import PageNotFound from "./PageNotFound";
import { MdTableRows } from "react-icons/md";
import { HiMiniViewColumns } from "react-icons/hi2";
import { Helmet } from "react-helmet";

/**
 * Try a set of endpoints and normalize episode list into:
 *  [
 *    { id, episodeNumber, title, isFiller, subStreams, dubStreams, hindiStreams }
 *  ]
 */
async function fetchEpisodesAllSources(animeId) {
  const normalized = (arr) =>
    arr.map((ep) => {
      const epNum =
        ep?.episodeNumber ??
        ep?.episode ??
        (typeof ep?.episodeNo === "number" ? ep.episodeNo : null) ??
        (typeof ep?.id === "string" && ep.id.includes("ep=") ? Number(ep.id.split("ep=").pop()) : null);

      return {
        id: ep.id ?? `${animeId}?ep=${epNum ?? ""}`,
        episodeNumber: epNum ?? null,
        title: ep.title ?? ep.name ?? ep.nameWithEpisode ?? `Episode ${epNum ?? ""}`,
        isFiller: Boolean(ep.isFiller || ep.filler),
        subStreams: ep.subStreams ?? ep.sources?.sub ?? ep.sub ?? ep.streams?.sub ?? [],
        dubStreams: ep.dubStreams ?? ep.sources?.dub ?? ep.dub ?? ep.streams?.dub ?? [],
        hindiStreams: ep.hindiStreams ?? ep.hindi ?? ep.hindi_dub ?? ep.streams?.hindi ?? [],
      };
    });

  const tryEndpoints = [];

  // 1) try local backend (relative). If you use VITE_API_BASE set it in env and it will be applied below.
  const viteBase = import.meta.env.VITE_API_BASE || "";
  const local = `${viteBase.replace(/\/$/, "")}/api/v1/episodes/${encodeURIComponent(animeId)}`;
  tryEndpoints.push({ url: local, kind: "local" });

  // 2) Hindi API (explicit)
  tryEndpoints.push({ url: `https://hindiapi.onrender.com/api/v1/episodes/${encodeURIComponent(animeId)}`, kind: "hindiapi" });

  // 3) Fallback: Consumet / gogoanime info
  tryEndpoints.push({ url: `https://api.consumet.org/anime/gogoanime/info/${encodeURIComponent(animeId)}`, kind: "consumet" });

  for (const e of tryEndpoints) {
    try {
      const res = await axios.get(e.url, { timeout: 8000 });
      const payload = res?.data ?? res;

      // normalize possible shapes
      let arr =
        Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.episodes)
          ? payload.episodes
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : null;

      // consumet sometimes gives payload.episodes with objects { number, title }
      if (!arr && e.kind === "consumet" && Array.isArray(payload?.episodes)) {
        arr = payload.episodes.map((it) => ({ episode: it.number ?? it.episode, title: it.title }));
      }

      if (!arr || !Array.isArray(arr) || arr.length === 0) continue;

      return normalized(arr);
    } catch (err) {
      // try next source
      // console.warn("fetchEpisodesAllSources failed for", e.url, err.message);
    }
  }

  return [];
}

const WatchPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("row");
  const [episodes, setEpisodes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const epParam = searchParams.get("ep");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const eps = await fetchEpisodesAllSources(id);
        if (!mounted) return;
        setEpisodes(eps);
      } catch (err) {
        if (!mounted) return;
        setLoadError(err.message || "Failed to load episodes");
        setEpisodes([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // auto-select first episode when we have list
  useEffect(() => {
    if (!epParam && Array.isArray(episodes) && episodes.length > 0) {
      const first = episodes[0];
      const epNum = first?.id?.includes("ep=") ? first.id.split("ep=").pop() : String(first?.episodeNumber ?? 1);
      if (epNum) {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          p.set("ep", epNum);
          return p;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes]);

  if (loadError) {
    return (
      <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
        <div className="p-6 text-center text-red-400">Error loading episodes: {loadError}</div>
      </div>
    );
  }

  if (loading || episodes === null) {
    return <Loader className="h-screen" />;
  }

  if (!Array.isArray(episodes) || episodes.length === 0) {
    return (
      <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
        <Helmet>
          <title>Watch | No episodes</title>
        </Helmet>
        <div className="p-6 text-center text-gray-300">No episodes found for this anime.</div>
      </div>
    );
  }

  // find current episode
  const currentEp = useMemo(() => {
    if (!epParam) return episodes[0];
    const found = episodes.find((e) => {
      if (e?.id?.includes("ep=")) return e.id.split("ep=").pop() === epParam;
      return String(e?.episodeNumber) === String(epParam);
    });
    return found || episodes[0];
  }, [episodes, epParam]);

  const currentIndex = episodes.findIndex((e) => e === currentEp);
  const hasNextEp = currentIndex > -1 && Boolean(episodes[currentIndex + 1]);
  const hasPrevEp = currentIndex > -1 && Boolean(episodes[currentIndex - 1]);

  const changeEpisode = (direction) => {
    if (currentIndex < 0) return;
    const target = direction === "next" ? episodes[currentIndex + 1] : episodes[currentIndex - 1];
    if (!target) return;
    const nextNum = target?.id?.includes("ep=") ? target.id.split("ep=").pop() : String(target?.episodeNumber ?? "");
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("ep", nextNum);
      return p;
    });
  };

  const currentEpNumber = currentEp?.id?.includes("ep=") ? currentEp.id.split("ep=").pop() : String(currentEp?.episodeNumber ?? 1);
  const episodeIdForPlayer = `${id}?ep=${currentEpNumber}`;

  return (
    <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
      <Helmet>
        <title>Watch {id?.split("-")?.slice(0, 2)?.join(" ")} Online | Watanuki</title>
      </Helmet>

      <div className="flex flex-col gap-2">
        <div className="path flex mb-2 mx-2 items-center gap-2 text-base ">
          <Link to="/home">
            <h4 className="hover:text-primary">home</h4>
          </Link>
          <span className="h-1 w-1 rounded-full bg-primary"></span>
          <Link to={`/anime/${id}`}>
            <h4 className="hover:text-primary">{id?.split("-")?.slice(0, 2)?.join(" ")}</h4>
          </Link>
          <span className="h-1 w-1 rounded-full bg-primary"></span>
          <h4 className="gray">episode {currentEp?.episodeNumber ?? currentEpNumber}</h4>
        </div>

        <Player
          episodeId={episodeIdForPlayer}
          currentEp={currentEp}
          changeEpisode={changeEpisode}
          hasNextEp={hasNextEp}
          hasPrevEp={hasPrevEp}
          hindiDub={Array.isArray(currentEp?.hindiStreams) ? currentEp.hindiStreams : currentEp?.hindi ?? []}
        />

        <div className="input w-full mt-2 flex items-end justify-end gap-3 text-end">
          <div className="btns bg-btnbg flex mx-2 rounded-child">
            <button className={`row item p-2 ${layout === "row" ? "bg-primary text-black" : ""}`} onClick={() => setLayout("row")}>
              <MdTableRows size={"20px"} />
            </button>
            <button className={`column item p-2 ${layout === "column" ? "bg-primary text-black" : ""}`} onClick={() => setLayout("column")}>
              <HiMiniViewColumns size={"20px"} />
            </button>
          </div>
        </div>

        <ul className={`episodes max-h-[50vh] py-4 px-2 overflow-scroll bg-lightbg grid gap-1 md:gap-2 ${layout === "row" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-5 md:grid-cols-10"}`}>
          {episodes.map((episode) => <Episodes key={episode.id ?? `${id}-${episode.episodeNumber}`} episode={episode} currentEp={currentEp} layout={layout} />)}
        </ul>
      </div>
    </div>
  );
};

export default WatchPage;
