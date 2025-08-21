const config = {
  serverUrl: import.meta.env.VITE_APP_SERVERURL,
  localUrl: import.meta.env.VITE_APP_LOCALURL || "https://hianime-api-55zq.onrender.com/api/v1",
  proxyUrl: import.meta.env.VITE_APP_PROXYURL,
  apiUrl: import.meta.env.VITE_APP_APIURL,
};

export default config;
