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
 * Robustly fetch episodes from multiple sources and normalize into:
 * [
 *   {
 *     id: "slug?ep=1",
 *     episodeNumber: 1,
 *     title: "Episode 1",
 *     isFiller: false,
 *     subStreams: [...],
 *     dubStreams: [...],
 *     hindiStreams: [...]
 *   },
 *   ...
 * ]
 *
 * Try order:
 * 1) frontend's API base (VITE_API_BASE or relative /api/v1)
 * 2) Hindi API (https://hindiapi.onrender.com/api/v1)
 * 3) Consumet gogoanime info (fallback) - best-effort mapping
 */
async function fetchEpisodesAllSources(animeId) {
  const normalized = (arr) =>
    arr.map((ep) => {
      // Try to determine episode number and id
      const epNum =
        ep?.episodeNumber ??
        ep?.episode ??
        (typeof ep?.id === "string" && ep.id.includes("ep=") ? Number(ep.id.split("ep=").pop()) : null);

      return {
        id: ep.id ?? `${animeId}?ep=${epNum ?? ""}`,
        episodeNumber: epNum ?? null,
        title: ep.title ?? ep.name ?? `Episode ${epNum ?? ""}`,
        isFiller: Boolean(ep.isFiller || ep.filler),
        subStreams: ep.subStreams ?? ep.sources?.sub ?? ep.sub ?? [],
        dubStreams: ep.dubStreams ?? ep.sources?.dub ?? ep.dub ?? [],
        hindiStreams: ep.hindiStreams ?? ep.hindi ?? ep.hindi_dub ?? [],
      };
    });

  const tryEndpoints = [];

  // 1) try VITE_API_BASE or relative
  const viteBase = import.meta.env.VITE_API_BASE || "";
  const localEndpoint = `${viteBase.replace(/\/$/, "")}/api/v1/episodes/${encodeURIComponent(animeId)}`;
  tryEndpoints.push({ url: localEndpoint, type: "local" });

  // 2) try Hindi API
  tryEndpoints.push({
    url: `https://hindiapi.onrender.com/api/v1/episodes/${encodeURIComponent(animeId)}`,
    type: "hindiapi",
  });

  // 3) fallback: consumet gogoanime info
  tryEndpoints.push({
    url: `https://api.consumet.org/anime/gogoanime/info/${encodeURIComponent(animeId)}`,
    type: "consumet",
  });

  // Try each until we get usable episodes
  for (const epEntry of tryEndpoints) {
    try {
      const res = await axios.get(epEntry.url, { timeout: 8000 });
      const payload = res?.data ?? res;

      // Normalize different shapes that endpoints might return:
      // - { episodes: [...] }, [ ... ], { data: [...] }, { data: { data: [...] } }
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

      // For consumet shape: payload.episodes is object with .number and .title etc.
      if (!arr && epEntry.type === "consumet" && payload?.episodes) {
        arr = payload.episodes.map((e) => ({
          episode: e.number ?? e.episode,
          title: e.title,
        }));
      }

      if (!arr || !Array.isArray(arr) || arr.length === 0) {
        continue; // try next endpoint
      }

      // If Hindi API returns episodes but in a different internal shape, normalize
      const final = normalized(arr);
      // Only accept if we have at least one with episodeNumber not null
      if (final.length > 0) return final;
    } catch (err) {
      // ignore & try next
      // console.warn("fetchEpisodesAllSources error for", epEntry.url, err.message);
    }
  }

  // Nothing worked, return empty array
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

  // auto-redirect to first episode if missing ep query
  useEffect(() => {
    if (!epParam && Array.isArray(episodes) && episodes.length > 0) {
      const first = episodes[0];
      const epNum = first?.id?.includes("ep=")
        ? first.id.split("ep=").pop()
        : String(first?.episodeNumber ?? 1);
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

  // compute currentEp from epParam or first
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

  const changeEpisode = (action) => {
    if (currentIndex < 0) return;
    const next = action === "next" ? episodes[currentIndex + 1] : episodes[currentIndex - 1];
    if (!next) return;
    const nextNum = next?.id?.includes("ep=") ? next.id.split("ep=").pop() : String(next?.episodeNumber ?? "");
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("ep", nextNum);
      return p;
    });
  };

  const currentEpNumber = currentEp?.id?.includes("ep=")
    ? currentEp.id.split("ep=").pop()
    : String(currentEp?.episodeNumber ?? 1);

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

        <ul
          className={`episodes max-h-[50vh] py-4 px-2 overflow-scroll bg-lightbg grid gap-1 md:gap-2 ${
            layout === "row" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-5 md:grid-cols-10"
          }`}
        >
          {episodes.map((episode) => (
            <Episodes key={episode.id ?? `${id}-${episode.episodeNumber}`} episode={episode} currentEp={currentEp} layout={layout} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WatchPage;
