/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";

const Player = ({
  episodeId,
  currentEp,
  changeEpisode,
  hasNextEp,
  hasPrevEp,
  hindiDub = [], // Array of Hindi stream objects or URLs
}) => {
  const [category, setCategory] = useState("sub");
  const [server, setServer] = useState("vidWish");
  const [currentHindiStreamIndex, setCurrentHindiStreamIndex] = useState(0);

  // Reset category and Hindi stream when episode changes
  useEffect(() => {
    setCategory("sub");
    setServer("vidWish");
    setCurrentHindiStreamIndex(0);
  }, [episodeId]);

  const changeCategory = (newType) => {
    if (newType !== category) {
      setCategory(newType);
      if (newType === "hindi" && hindiDub.length > 0) {
        setCurrentHindiStreamIndex(0); // Reset to first Hindi stream
      }
    }
  };

  const changeServer = (newServer) => {
    if (newServer !== server) setServer(newServer);
  };

  const buildSrc = () => {
    if (category === "hindi" && hindiDub.length > 0) {
      const stream = hindiDub[currentHindiStreamIndex];
      return typeof stream === "string" ? stream : stream.url;
    }

    // Sub / Dub servers
    return `https://${
      server === "vidWish" ? "vidwish.live" : "megaplay.buzz"
    }/stream/s-2/${episodeId.split("ep=").pop()}/${category}`;
  };

  // Optional: switch Hindi streams if multiple available
  const nextHindiStream = () => {
    if (hindiDub.length <= 1) return;
    setCurrentHindiStreamIndex((prev) => (prev + 1) % hindiDub.length);
  };

  return (
    <>
      {/* Video Player */}
      <div className="w-full bg-background aspect-video relative rounded-sm max-w-screen-xl overflow-hidden">
        <iframe src={buildSrc()} width="100%" height="100%" allowFullScreen></iframe>
      </div>

      {/* Controls */}
      <div className="category flex flex-wrap flex-col sm:flex-row items-center justify-center sm:justify-between px-2 md:px-20 gap-3 bg-lightbg py-2">
        {/* Server Switch */}
        <div className="servers flex gap-4">
          <button
            onClick={() => changeServer("vidWish")}
            className={`${
              server === "vidWish" ? "bg-primary text-black" : "bg-btnbg text-white"
            } px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"} // Hindi is only Vidnest
          >
            vidwish
          </button>
          <button
            onClick={() => changeServer("megaPlay")}
            className={`${
              server === "megaPlay" ? "bg-primary text-black" : "bg-btnbg text-white"
            } px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"}
          >
            megaplay
          </button>
        </div>

        {/* Category Switch */}
        <div className="flex gap-5">
          <div className="sound flex gap-3">
            {["sub", "dub"].map((type) => (
              <button
                key={type}
                onClick={() => changeCategory(type)}
                className={`${
                  category === type ? "bg-primary text-black" : "bg-btnbg text-white"
                } px-2 py-1 rounded text-sm font-semibold`}
              >
                {type.toUpperCase()}
              </button>
            ))}

            {hindiDub.length > 0 && (
              <button
                onClick={() => changeCategory("hindi")}
                className={`${
                  category === "hindi" ? "bg-primary text-black" : "bg-btnbg text-white"
                } px-2 py-1 rounded text-sm font-semibold`}
              >
                HINDI DUB
              </button>
            )}

            {/* If multiple Hindi streams, show next button */}
            {category === "hindi" && hindiDub.length > 1 && (
              <button
                onClick={nextHindiStream}
                className="bg-btnbg text-white px-2 py-1 rounded text-sm font-semibold"
              >
                Next Hindi Stream
              </button>
            )}
          </div>

          {/* Prev / Next Episode Buttons */}
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

        {/* Episode Info */}
        <div className="flex flex-col">
          <p className="text-gray-400">You are watching Episode {currentEp.episodeNumber}</p>
          {currentEp.isFiller && <p className="text-red-400">You are watching a filler Episode 👻</p>}
        </div>
      </div>
    </>
  );
};

export default Player;
