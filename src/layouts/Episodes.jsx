/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

const Episodes = ({ episode, currentEp, layout }) => {
  const isCurrent = currentEp && episode.id === currentEp.id;
  const safeId = encodeURIComponent(episode.id);
  return (
    <>
      {layout === "row" ? (
        <li className={`w-full px-2 py-3 ${isCurrent ? "bg-primary text-black" : episode.isFiller ? "bg-red-500 text-black" : "bg-btnbg text-white"}`}>
          <Link to={`/watch/${safeId}`} className="block w-full">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <div className="font-semibold">Episode {episode.episodeNumber}</div>
                <div className="text-sm text-gray-300 truncate">{episode.title}</div>
              </div>
              <div className="flex flex-col gap-1 items-end">
                {episode.subStreams && episode.subStreams.length > 0 && <span className="text-xs px-2 py-1 rounded bg-neutral-800">SUB</span>}
                {episode.dubStreams && episode.dubStreams.length > 0 && <span className="text-xs px-2 py-1 rounded bg-neutral-800">DUB</span>}
                {episode.hindiStreams && episode.hindiStreams.length > 0 && <span className="text-xs px-2 py-1 rounded bg-yellow-400 text-black">HINDI</span>}
              </div>
            </div>
          </Link>
        </li>
      ) : (
        <li className={`w-full rounded-sm py-1 ${isCurrent ? "bg-primary text-black" : episode.isFiller ? "bg-red-500 text-black" : "bg-btnbg text-white"}`}>
          <Link to={`/watch/${safeId}`}>
            <p className="text-center font-semibold">{episode.episodeNumber}</p>
          </Link>
        </li>
      )}
    </>
  );
};

export default Episodes;
