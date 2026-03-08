import { useState, useEffect } from 'react';

const useViewport = (threshold = 1024) => {
  const [isSmallViewport, setIsSmallViewport] = useState(window.innerWidth < threshold);

  useEffect(() => {
    const handleResize = () => {
      const newIsSmallViewport = window.innerWidth < threshold;
      setIsSmallViewport(newIsSmallViewport);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isSmallViewport;
};

export default useViewport;
