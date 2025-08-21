/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";

const Player = ({
  episodeId,
  currentEp,
  changeEpisode,
  hasNextEp,
  hasPrevEp,
  hindiDub = [], // array of {url:String} or String
}) => {
  const [category, setCategory] = useState("sub");
  const [server, setServer] = useState("vidWish");
  const [hindiIndex, setHindiIndex] = useState(0);

  // Reset state when episode changes
  useEffect(() => {
    setCategory("sub");
    setServer("vidWish");
    setHindiIndex(0);
  }, [episodeId]);

  const changeCategory = (newType) => {
    if (newType !== category) {
      setCategory(newType);
      if (newType === "hindi") setHindiIndex(0);
    }
  };

  const changeServer = (newServer) => {
    if (newServer !== server) setServer(newServer);
  };

  const getHindiUrl = () => {
    if (!hindiDub.length) return null;
    const entry = hindiDub[hindiIndex] ?? hindiDub[0];
    return typeof entry === "string" ? entry : entry?.url;
  };

  const buildSrc = () => {
    if (category === "hindi") {
      const url = getHindiUrl();
      if (url) return url;
    }
    // SUB/DUB use original servers
    const epNum = episodeId.includes("ep=")
      ? episodeId.split("ep=").pop()
      : String(currentEp?.episodeNumber ?? 1);
    return `https://${server === "vidWish" ? "vidwish.live" : "megaplay.buzz"}/stream/s-2/${epNum}/${category}`;
  };

  const nextHindiStream = () => {
    if (hindiDub.length <= 1) return;
    setHindiIndex((i) => (i + 1) % hindiDub.length);
  };

  return (
    <>
      {/* Video */}
      <div className="w-full bg-background aspect-video relative rounded-sm max-w-screen-xl overflow-hidden">
        <iframe src={buildSrc()} width="100%" height="100%" allowFullScreen></iframe>
      </div>

      {/* Controls */}
      <div className="category flex flex-wrap flex-col sm:flex-row items-center justify-center sm:justify-between px-2 md:px-20 gap-3 bg-lightbg py-2">
        {/* Servers */}
        <div className="servers flex gap-4">
          <button
            onClick={() => changeServer("vidWish")}
            className={`${server === "vidWish" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"}
          >
            vidwish
          </button>
          <button
            onClick={() => changeServer("megaPlay")}
            className={`${server === "megaPlay" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"}
          >
            megaplay
          </button>
        </div>

        {/* Categories */}
        <div className="flex gap-5">
          <div className="sound flex gap-3">
            {["sub", "dub"].map((type) => (
              <button
                key={type}
                onClick={() => changeCategory(type)}
                className={`${category === type ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
              >
                {type.toUpperCase()}
              </button>
            ))}

            {hindiDub.length > 0 && (
              <>
                <button
                  onClick={() => changeCategory("hindi")}
                  className={`${category === "hindi" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
                >
                  HINDI DUB
                </button>
                {category === "hindi" && hindiDub.length > 1 && (
                  <button
                    onClick={nextHindiStream}
                    className="bg-btnbg text-white px-2 py-1 rounded text-sm font-semibold"
                    title="Switch Hindi source"
                  >
                    Next Hindi
                  </button>
                )}
              </>
            )}
          </div>

          {/* Prev/Next */}
          <div className="btns flex gap-4">
            {hasPrevEp && (
              <button
                title="prev"
                className="prev bg-primary px-2 py-1 rounded-md text-black"
                onClick={() => changeEpisode("prev")}
              >
                <TbPlayerTrackPrevFilled />
              </button>
            )}
            {hasNextEp && (
              <button
                title="next"
                className="next bg-primary px-2 py-1 rounded-md text-black"
                onClick={() => changeEpisode("next")}
              >
                <TbPlayerTrackNextFilled />
              </button>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <p className="text-gray-400">You are watching Episode {currentEp?.episodeNumber ?? ""}</p>
          {currentEp?.isFiller && (
            <p className="text-red-400">You are watching a filler Episode 👻</p>
          )}
        </div>
      </div>
    </>
  );
};

export default Player;
