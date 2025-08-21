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

const WatchPage = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [layout, setLayout] = useState("row");

  const epParam = searchParams.get("ep");

  // fetch episodes from API
  const { data, isError } = useApi(`/episodes/${id}`);
  const episodes = data?.data || data || []; // support either {data:[]} or [] shape

  const updateParams = (newEp) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("ep", newEp);
      return p;
    });
  };

  // auto-select first episode when ready
  useEffect(() => {
    if (!epParam && Array.isArray(episodes) && episodes.length > 0) {
      const firstEpNum =
        episodes[0]?.id?.includes("ep=")
          ? episodes[0].id.split("ep=").pop()
          : String(episodes[0]?.episodeNumber ?? 1);
      if (firstEpNum) updateParams(firstEpNum);
    }
  }, [epParam, episodes]);

  if (isError) return <PageNotFound />;

  // still loading
  if (!Array.isArray(episodes)) {
    return <Loader className="h-screen" />;
  }

  // no episodes
  if (episodes.length === 0) {
    return (
      <div className="bg-backGround pt-14 max-w-screen-xl mx-auto py-2 md:px-2">
        <Helmet>
          <title>Watch | No episodes found</title>
        </Helmet>
        <div className="p-6 text-center text-gray-300">
          No episodes found for this anime.
        </div>
      </div>
    );
  }

  // find current episode by `?ep` or fallback to first
  const currentEp = useMemo(() => {
    if (!episodes?.length) return null;

    // preferred: match by ep param against "id?...ep=NNN"
    if (epParam) {
      const found = episodes.find((e) => {
        if (e?.id?.includes("ep=")) {
          return e.id.split("ep=").pop() === epParam;
        }
        // fallback: compare numbers
        return String(e?.episodeNumber) === epParam;
      });
      if (found) return found;
    }

    return episodes[0];
  }, [episodes, epParam]);

  // compute flags for next/prev safely
  const currentIndex = useMemo(() => {
    if (!currentEp) return -1;
    return episodes.findIndex((e) => e === currentEp);
  }, [episodes, currentEp]);

  const hasNextEp = currentIndex > -1 && Boolean(episodes[currentIndex + 1]);
  const hasPrevEp = currentIndex > -1 && Boolean(episodes[currentIndex - 1]);

  const changeEpisode = (action) => {
    if (currentIndex < 0) return;
    if (action === "next") {
      const next = episodes[currentIndex + 1];
      if (!next) return;
      const nextEpNum = next?.id?.includes("ep=")
        ? next.id.split("ep=").pop()
        : String(next?.episodeNumber ?? "");
      if (nextEpNum) updateParams(nextEpNum);
    } else {
      const prev = episodes[currentIndex - 1];
      if (!prev) return;
      const prevEpNum = prev?.id?.includes("ep=")
        ? prev.id.split("ep=").pop()
        : String(prev?.episodeNumber ?? "");
      if (prevEpNum) updateParams(prevEpNum);
    }
  };

  // IMPORTANT: pass Hindi streams down (array or empty)
  const hindiStreams = Array.isArray(currentEp?.hindiStreams)
    ? currentEp.hindiStreams
    : [];

  // episode id to feed Player (keep existing shape)
  const episodeIdForPlayer =
    currentEp?.id?.includes("?ep=")
      ? currentEp.id
      : `${id}?ep=${
          epParam ??
          (currentEp?.id?.includes("ep=")
            ? currentEp.id.split("ep=").pop()
            : String(currentEp?.episodeNumber ?? 1))
        }`;

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
          <h4 className="gray">
            episode {currentEp?.episodeNumber ?? epParam ?? ""}
          </h4>
        </div>

        {/* Player */}
        {currentEp && (
          <Player
            id={id}
            episodeId={episodeIdForPlayer}
            currentEp={currentEp}
            changeEpisode={changeEpisode}
            hasNextEp={hasNextEp}
            hasPrevEp={hasPrevEp}
            hindiDub={hindiStreams} // ← pass Hindi
          />
        )}

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
              key={episode.id}
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
