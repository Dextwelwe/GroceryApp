import { useEffect } from "react";

export function usePreloadImages(urls = []) {
  useEffect(() => {
    const imgs = urls.map((src) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = src; 
      return img;
    });
    return () => { imgs.forEach(i => (i.src = "")); };
    // eslint-disable-next-line
  }, [urls.join("|")]);
}