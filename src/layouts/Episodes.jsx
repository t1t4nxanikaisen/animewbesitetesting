/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";

const Episodes = ({ episode, currentEp, layout }) => {
  const isCurrent = episode.id === currentEp?.id;

  // Encode episode id safely for router link
  const safeEpisodeId = encodeURIComponent(episode.id);

  return (
    <>
      {layout === "row" ? (
        <li
          title={episode.title}
          className={`w-full px-2 py-3 text-black cursor-pointer
            ${
              isCurrent
                ? "bg-primary"
                : episode.isFiller
                ? "bg-red-500"
                : "bg-btnbg"
            }
          `}
        >
          <Link to={`/watch/${safeEpisodeId}`} className="block w-full">
            <div className="flex gap-3 items-center">
              <span
                className={`text-sm font-semibold ${
                  isCurrent ? "text-black" : "text-primary"
                }`}
              >
                {episode.episodeNumber}
              </span>
              <span
                className={`flex-1 truncate text-sm ${
                  isCurrent ? "text-black" : "text-white"
                }`}
              >
                {episode.title}
              </span>
              {episode.isFiller && <span title="Filler">👻</span>}
            </div>
          </Link>
        </li>
      ) : (
        <li
          title={episode.title}
          className={`w-full rounded-sm py-1 cursor-pointer
             ${
               isCurrent
                 ? "bg-primary"
                 : episode.isFiller
                 ? "bg-red-500"
                 : "bg-btnbg"
             }
          `}
        >
          <Link to={`/watch/${safeEpisodeId}`} className="block w-full">
            <p
              className={`text-sm md:text-base text-center font-semibold ${
                isCurrent ? "text-black" : "text-white"
              }`}
            >
              {episode.episodeNumber}
            </p>
          </Link>
        </li>
      )}
    </>
  );
};

export default Episodes;
