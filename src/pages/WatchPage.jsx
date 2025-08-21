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
 * Try and normalize possible shapes returned by API endpoints.
 */
function normalizeEpisodes(payload) {
  if (!payload) return [];
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.episodes,
    payload?.data?.episodes,
    payload?.result,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

const tryEndpointsForEpisodes = async (animeId) => {
  const tryList = [];
  const base = import.meta.env.VITE_API_BASE || "";
  const local = `${base.replace(/\/$/, "")}/api/v1/episodes/${encodeURIComponent(animeId)}`;
  tryList.push(local);
  tryList.push(`https://hindiapi.onrender.com/api/v1/episodes/${encodeURIComponent(animeId)}`);
  tryList.push(`https://api.consumet.org/anime/gogoanime/info/${encodeURIComponent(animeId)}`);

  for (const url of tryList) {
    try {
      const res = await axios.get(url, { timeout: 8000 });
      const normalized = normalizeEpisodes(res.data);
      if (normalized && normalized.length) return normalized;
    } catch (err) {
      // continue
    }
  }
  return [];
};

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
        const eps = await tryEndpointsForEpisodes(id);
        if (!mounted) return;
        setEpisodes(eps);
      } catch (err) {
        if (!mounted) return;
        setLoadError(err.message || "Failed to fetch episodes");
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

  useEffect(() => {
    if (!epParam && Array.isArray(episodes) && episodes.length > 0) {
      const first = episodes[0];
      const firstNum = first?.id?.includes("ep=") ? first.id.split("ep=").pop() : String(first?.episodeNumber ?? 1);
      if (firstNum) {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          p.set("ep", firstNum);
          return p;
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [episodes]);

  if (loadError) return <PageNotFound />;

  if (loading || episodes === null) return <Loader className="h-screen" />;

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
    const target = action === "next" ? episodes[currentIndex + 1] : episodes[currentIndex - 1];
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
        <title>Watch {id?.split("-")?.slice(0, 2)?.join(" ")} Online</title>
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
          {episodes.map((episode) => (
            <Episodes key={epi
