/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import axios from "axios";

const Player = ({ episodeId, currentEp, changeEpisode, hasNextEp, hasPrevEp, hindiDub = [] }) => {
  const [category, setCategory] = useState("sub"); // sub | dub | hindi
  const [server, setServer] = useState("vidWish"); // vidWish | megaPlay
  const [hindiIndex, setHindiIndex] = useState(0);
  const [serversList, setServersList] = useState({ sub: [], dub: [], hindi: [] });
  const [selectedServer, setSelectedServer] = useState(null);

  useEffect(() => {
    setCategory("sub");
    setServer("vidWish");
    setHindiIndex(0);
    setServersList({ sub: [], dub: [], hindi: [] });
    setSelectedServer(null);

    let mounted = true;
    (async () => {
      try {
        const res = await axios.get("/api/v1/stream", { params: { id: episodeId, type: "all" } });
        const servers = res?.data?.data?.servers ?? {};
        if (!mounted) return;
        setServersList({
          sub: servers.sub ?? [],
          dub: servers.dub ?? [],
          hindi: servers.hindi ?? [],
        });
      } catch (err) {
        console.error("Failed to fetch servers:", err);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [episodeId]);

  const changeCategory = (newType) => {
    if (newType !== category) {
      setCategory(newType);
      if (newType === "hindi") {
        setHindiIndex(0);
        const h = serversList.hindi;
        if (h && h.length) setSelectedServer(h[0]);
      } else {
        setSelectedServer(null);
      }
    }
  };

  const changeServerLocal = (newServer) => {
    if (newServer !== server) setServer(newServer);
  };

  const getHindiUrl = () => {
    if (serversList.hindi && serversList.hindi.length > 0) {
      const entry = serversList.hindi[hindiIndex] ?? serversList.hindi[0];
      return typeof entry === "string" ? entry : entry?.url;
    }
    if (hindiDub && hindiDub.length > 0) {
      const entry = hindiDub[hindiIndex] ?? hindiDub[0];
      return typeof entry === "string" ? entry : entry?.url;
    }
    return null;
  };

  const getSubDubUrl = () => {
    if (selectedServer && category !== "hindi") {
      return `/api/v1/stream?id=${encodeURIComponent(episodeId)}&type=${encodeURIComponent(category)}&server=${encodeURIComponent(selectedServer.name || selectedServer.server)}`;
    }
    const epnum = episodeId.includes("ep=") ? episodeId.split("ep=").pop() : currentEp?.episodeNumber;
    const base = server === "vidWish" ? "vidwish.live" : "megaplay.buzz";
    return `https://${base}/stream/s-2/${epnum}/${category}`;
  };

  const buildSrc = () => {
    if (category === "hindi") return getHindiUrl();
    if (selectedServer && selectedServer.url) return selectedServer.url;
    return getSubDubUrl();
  };

  const handleSelectServer = (srv) => {
    setSelectedServer(srv);
    if (srv.url) setCategory(category); // keep category
  };

  const nextHindi = () => {
    if (!serversList.hindi || serversList.hindi.length <= 1) return;
    setHindiIndex((i) => (i + 1) % serversList.hindi.length);
  };

  return (
    <>
      <div className="w-full bg-background aspect-video relative rounded-sm max-w-screen-xl overflow-hidden">
        <iframe src={buildSrc()} width="100%" height="100%" allowFullScreen title="player" />
      </div>

      <div className="category flex flex-wrap flex-col sm:flex-row items-center justify-center sm:justify-between px-2 md:px-20 gap-3 bg-lightbg py-2">
        <div className="servers flex gap-4">
          <button
            onClick={() => changeServerLocal("vidWish")}
            className={`${server === "vidWish" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"}
          >
            vidwish
          </button>
          <button
            onClick={() => changeServerLocal("megaPlay")}
            className={`${server === "megaPlay" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
            disabled={category === "hindi"}
          >
            megaplay
          </button>
        </div>

        <div className="flex gap-5">
          <div className="sound flex gap-3">
            {["sub", "dub"].map((t) => (
              <button
                key={t}
                onClick={() => changeCategory(t)}
                className={`${category === t ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
              >
                {t.toUpperCase()}
              </button>
            ))}

            {((hindiDub && hindiDub.length) || (serversList.hindi && serversList.hindi.length)) > 0 && (
              <>
                <button
                  onClick={() => changeCategory("hindi")}
                  className={`${category === "hindi" ? "bg-primary text-black" : "bg-btnbg text-white"} px-2 py-1 rounded text-sm font-semibold`}
                >
                  HINDI DUB
                </button>
                {category === "hindi" && ((serversList.hindi && serversList.hindi.length) > 1 || (hindiDub && hindiDub.length > 1)) && (
                  <button onClick={nextHindi} className="bg-btnbg text-white px-2 py-1 rounded text-sm font-semibold">
                    Next Hindi
                  </button>
                )}
              </>
            )}
          </div>

          <div className="btns flex gap-4">
            {hasPrevEp && (
              <button title="prev" className="prev bg-primary px-2 py-1 rounded-md text-black" onClick={() => changeEpisode("prev")}>
                <TbPlayerTrackPrevFilled />
              </button>
            )}
            {hasNextEp && (
              <button title="next" className="next bg-primary px-2 py-1 rounded-md text-black" onClick={() => changeEpisode("next")}>
                <TbPlayerTrackNextFilled />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-gray-400">You are watching Episode {currentEp?.episodeNumber ?? ""}</p>
          {currentEp?.isFiller && <p className="text-red-400">You are watching a filler Episode 👻</p>}
        </div>
      </div>

      <div className="py-2 px-2 bg-lightbg flex gap-2 flex-wrap">
        {serversList.sub?.map((s, i) => (
          <button key={`sub-${i}`} className="px-2 py-1 bg-btnbg text-white rounded text-sm" onClick={() => { setCategory("sub"); handleSelectServer(s); }}>
            {s.name ?? s.server ?? `sub-${i + 1}`}
          </button>
        ))}
        {serversList.dub?.map((s, i) => (
          <button key={`dub-${i}`} className="px-2 py-1 bg-btnbg text-white rounded text-sm" onClick={() => { setCategory("dub"); handleSelectServer(s); }}>
            {s.name ?? s.server ?? `dub-${i + 1}`}
          </button>
        ))}
        {serversList.hindi && serversList.hindi.length > 0 && (
          <button key="hindi-server" className="px-2 py-1 bg-yellow-400 text-black rounded text-sm" onClick={() => { setCategory("hindi"); setHindiIndex(0); }}>
            Play Hindi ({serversList.hindi.length})
          </button>
        )}
      </div>
    </>
  );
};

export default Player;
