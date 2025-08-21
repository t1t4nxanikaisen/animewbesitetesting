/* eslint-disable react/prop-types */
import { useState } from "react";
import {
  TbPlayerTrackPrevFilled,
  TbPlayerTrackNextFilled,
} from "react-icons/tb";

const Player = ({
  episodeId,
  currentEp,
  changeEpisode,
  hasNextEp,
  hasPrevEp,
  hindiDub = [], // Accepts an array of streams
}) => {
  const [category, setCategory] = useState("sub");
  const [server, setServer] = useState("vidWish");
  const [currentHindiStream, setCurrentHindiStream] = useState(
    hindiDub.length > 0 ? hindiDub[0] : null
  );

  const changeCategory = (newType) => {
    if (newType !== category) {
      setCategory(newType);
      // If switching to Hindi, set first stream
      if (newType === "hindi" && hindiDub.length > 0) {
        setCurrentHindiStream(hindiDub[0]);
      }
    }
  };

  const changeServer = (newServer) => {
    if (newServer !== server) setServer(newServer);
  };

  // Build iframe URL based on category + server
  const buildSrc = () => {
    if (category === "hindi" && currentHindiStream) {
      return currentHindiStream.url || currentHindiStream; // support object or string
    }

    // Sub / Dub -> existing servers
    return `https://${
      server === "vidWish" ? "vidwish.live" : "megaplay.buzz"
    }/stream/s-2/${episodeId.split("ep=").pop()}/${category}`;
  };

  return (
    <>
      {/* Video Player */}
      <div className="w-full bg-background aspect-video relative rounded-sm max-w-screen-xl overflow-hidden">
        <iframe
          src={buildSrc()}
          width="100%"
          height="100%"
          allowFullScreen
        ></iframe>
      </div>

      {/* Controls */}
      <div className="category flex flex-wrap flex-col sm:flex-row items-center justify-center sm:justify-between px-2 md:px-20 gap-3 bg-lightbg py-2">
        {/* Server Switch */}
        <div className="servers flex gap-4">
          <button
            onClick={() => changeServer("vidWish")}
            className={`${
              server === "vidWish"
                ? "bg-primary text-black"
                : "bg-btnbg text-white"
            } px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"} // Hindi is only Vidnest
          >
            vidwish
          </button>
          <button
            onClick={() => changeServer("megaPlay")}
            className={`${
              server === "megaPlay"
                ? "bg-primary text-black"
                : "bg-btnbg text-white"
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
                  category === type
                    ? "bg-primary text-black"
                    : "bg-btnbg text-white"
                } px-2 py-1 rounded text-sm font-semibold`}
              >
                {type.toUpperCase()}
              </button>
            ))}

            {/* Show Hindi button only if we have streams */}
            {hindiDub.length > 0 && (
              <button
                onClick={() => changeCategory("hindi")}
                className={`${
                  category === "hindi"
                    ? "bg-primary text-black"
                    : "bg-btnbg text-white"
                } px-2 py-1 rounded text-sm font-semibold`}
              >
                HINDI DUB
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
          <p className="text-gray-400">
            You are watching Episode {currentEp.episodeNumber}
          </p>
          {currentEp.isFiller && (
            <p className="text-red-400">
              You are watching a filler Episode 👻
            </p>
          )}
        </div>
      </div>
    </>
  );
};

export default Player;
