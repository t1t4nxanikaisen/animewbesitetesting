import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader";
import Player from "../components/Player";
import Episodes from "../layouts/Episodes";
import { useApi } from "../services/useApi";
import PageNotFound from "./PageNotFound";
import { MdTableRows } from "react-icons/md";
import { HiMiniViewColumns } from "react-icons/hi2";
import { Helmet } from "react-helmet";

function normalizeEpisodes(payload) {
  // Try a bunch of common shapes your API might return
  const candidates = [
    payload,
    payload?.data,
    payload?.data?.data,
    payload?.episodes,
    payload?.data?.episodes,
    payload?.result,
    payload?.payload,
  ].filter(Boolean);

  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

const WatchPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("row");

  const epParam = searchParams.get("ep");

  // Fetch episodes from API
  const { data, isError, isLoading } = useApi(`/episodes/${id}`);

  // Normalize to always get an array
  const episodes = useMemo(() => normalizeEpisodes(data), [data]);

  const updateParams = (newEp) => {
    if (!newEp) return;
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("ep", String(newEp));
      return p;
    });
  };

  // Auto-redirect to the first episode if no `ep` yet
  useEffect(() => {
    if (!epParam && Array.isArray(episodes) && episodes.length > 0) {
      const firstEp = episodes[0];
      const firstEpNum = firstEp?.id?.includes("ep=")
        ? firstEp.id.split("ep=").pop()
        : String(firstEp?.episodeNumber ?? 1);
      updateParams(firstEpNum);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [epParam, episodes]);

  if (isError) return <PageNotFound />;

  // Show loader while initial fetch is in flight
  if (isLoading || !Array.isArray(episodes)) {
    return <Loader className="h-screen" />;
  }

  // If normalize didn’t find anything, show message
  const hasEpisodes = Array.isArray(episodes) && episodes.length > 0;
  if (!hasEpisodes) {
    return (
      <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
        <Helmet>
          <title>Watch | No episodes</title>
        </Helmet>
        <div className="p-6 text-center text-gray-300">
          No episodes found for this anime.
        </div>
      </div>
    );
  }

  // Find current episode safely
  const currentEp = useMemo(() => {
    if (!epParam) return episodes[0];
    const byQuery = episodes.find((e) => {
      if (e?.id?.includes("ep=")) {
        return e.id.split("ep=").pop() === epParam;
      }
      return String(e?.episodeNumber) === String(epParam);
    });
    return byQuery || episodes[0];
  }, [episodes, epParam]);

  // Index and navigation
  const currentIndex = useMemo(
    () => episodes.findIndex((e) => e === currentEp),
    [episodes, currentEp]
  );
  const hasNextEp = currentIndex > -1 && Boolean(episodes[currentIndex + 1]);
  const hasPrevEp = currentIndex > -1 && Boolean(episodes[currentIndex - 1]);

  const changeEpisode = (direction) => {
    if (currentIndex < 0) return;
    if (direction === "next") {
      const next = episodes[currentIndex + 1];
      if (!next) return;
      const nextNum = next?.id?.includes("ep=")
        ? next.id.split("ep=").pop()
        : String(next?.episodeNumber ?? "");
      updateParams(nextNum);
    } else {
      const prev = episodes[currentIndex - 1];
      if (!prev) return;
      const prevNum = prev?.id?.includes("ep=")
        ? prev.id.split("ep=").pop()
        : String(prev?.episodeNumber ?? "");
      updateParams(prevNum);
    }
  };

  // Pass Hindi streams if present (support multiple possible keys)
  const hindiStreams =
    (Array.isArray(currentEp?.hindiStreams) && currentEp.hindiStreams) ||
    (Array.isArray(currentEp?.hindi) && currentEp.hindi) ||
    (Array.isArray(currentEp?.hindi_dub) && currentEp.hindi_dub) ||
    [];

  // Build episodeId to keep your original Player logic working
  const currentEpNumber =
    epParam ||
    (currentEp?.id?.includes("ep=")
      ? currentEp.id.split("ep=").pop()
      : String(currentEp?.episodeNumber ?? 1));

  const episodeIdForPlayer = `${id}?ep=${currentEpNumber}`;

  return (
    <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
      <Helmet>
        <title>
          Watch {id?.split("-")?.slice(0, 2)?.join(" ")} Online | Watanuki
        </title>
        <meta property="og:title" content="watch - watanuki" />
      </Helmet>

      <div className="flex flex-col gap-2">
        {/* breadcrumbs */}
        <div className="path flex mb-2 mx-2 items-center gap-2 text-base ">
          <Link className="" to="/home">
            <h4 className="hover:text-primary">home</h4>
          </Link>
          <span className="h-1 w-1 rounded-full bg-primary"></span>
          <Link to={`/anime/${id}`}>
            <h4 className="hover:text-primary">
              {id?.split("-")?.slice(0, 2)?.join(" ")}
            </h4>
          </Link>
          <span className="h-1 w-1 rounded-full bg-primary"></span>
          <h4 className="gray">episode {currentEp?.episodeNumber ?? currentEpNumber}</h4>
        </div>

        {/* Player */}
        <Player
          id={id}
          episodeId={episodeIdForPlayer}
          currentEp={currentEp}
          changeEpisode={changeEpisode}
          hasNextEp={hasNextEp}
          hasPrevEp={hasPrevEp}
          hindiDub={hindiStreams}
        />

        {/* Layout toggle */}
        <div className="input w-full mt-2 flex items-end justify-end gap-3 text-end">
          <div className="btns bg-btnbg flex mx-2 rounded-child">
            <button
              className={`row item p-2 ${
                layout === "row" ? "bg-primary text-black" : ""
              }`}
              onClick={() => setLayout("row")}
            >
              <MdTableRows size={"20px"} />
            </button>
            <button
              className={`column item p-2 ${
                layout === "column" ? "bg-primary text-black" : ""
              }`}
              onClick={() => setLayout("column")}
            >
              <HiMiniViewColumns size={"20px"} />
            </button>
          </div>
        </div>

        {/* Episode list */}
        <ul
          className={`episodes max-h-[50vh] py-4 px-2 overflow-scroll bg-lightbg grid gap-1 md:gap-2 ${
            layout === "row"
              ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              : "grid-cols-5 md:grid-cols-10"
          }`}
        >
          {episodes.map((episode) => (
            <Episodes
              key={episode.id ?? `${id}-${episode.episodeNumber}`}
              episode={episode}
              currentEp={currentEp}
              layout={layout}
            />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default WatchPage;
