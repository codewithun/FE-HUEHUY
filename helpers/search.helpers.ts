import { useEffect, useState } from 'react';

export const useLazySearch = (keyword: string) => {
  const [keywordSearch, setKeywordSearch] = useState('');
  const [doSearch, setDoSearch] = useState(false);

  useEffect(() => {
    if (keyword != undefined) {
      const delaySearch = setTimeout(() => {
        setDoSearch(!doSearch);
      }, 500);
      return () => clearTimeout(delaySearch);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyword]);

  useEffect(() => {
    setKeywordSearch(keyword);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doSearch]);

  return [keywordSearch];
};
