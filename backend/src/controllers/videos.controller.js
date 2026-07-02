const axios = require('axios');
const logger = require('../utils/logger');

// Generador de datos simulados (mock) para pruebas sin una clave de API
const getMockVideos = (query = '', pageToken = '') => {
  const allMockVideos = [
    {
      videoId: 'dQw4w9WgXcQ',
      title: 'Rick Astley - Never Gonna Give You Up (Official Music Video)',
      description: 'The official video for Never Gonna Give You Up by Rick Astley. Subscribe to the official Rick Astley YouTube channel.',
      thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      channelTitle: 'Rick Astley',
      publishedAt: '2009-10-25T00:00:00Z'
    },
    {
      videoId: '9bZkp7q19f0',
      title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
      description: 'PSY - Gangnam Style (Official Music Video). Check out the iconic Korean pop song that broke the internet.',
      thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/0.jpg',
      channelTitle: 'officialpsy',
      publishedAt: '2012-07-15T00:00:00Z'
    },
    {
      videoId: 'kJQP7kiw5Fk',
      title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
      description: 'Despacito available on all digital platforms: https://LuisFonsi.lnk.to/DespacitoYD. The most viewed video in YouTube history.',
      thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/0.jpg',
      channelTitle: 'LuisFonsiVEVO',
      publishedAt: '2017-01-13T00:00:00Z'
    },
    {
      videoId: 'jNQXAC9IVRw',
      title: 'Me at the zoo',
      description: 'The first video on YouTube. Uploaded by co-founder Jawed Karim at San Diego Zoo.',
      thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/0.jpg',
      channelTitle: 'jawed',
      publishedAt: '2005-04-23T00:00:00Z'
    },
    {
      videoId: 'OPf0YbXqDm0',
      title: 'Mark Ronson - Uptown Funk (Official Video) ft. Bruno Mars',
      description: 'Uptown Funk ft. Bruno Mars. From the album Uptown Special. A modern retro-pop classic.',
      thumbnailUrl: 'https://img.youtube.com/vi/OPf0YbXqDm0/0.jpg',
      channelTitle: 'MarkRonsonVEVO',
      publishedAt: '2014-11-19T00:00:00Z'
    },
    {
      videoId: 'fRh_dkD7XXc',
      title: 'Introducing Google Translate',
      description: 'Translate the world with the Google Translate app. Speak, scan, write, or type in over 100 languages.',
      thumbnailUrl: 'https://img.youtube.com/vi/fRh_dkD7XXc/0.jpg',
      channelTitle: 'Google',
      publishedAt: '2015-01-14T00:00:00Z'
    },
    {
      videoId: 'y6120QOlsfU',
      title: 'The Mountain - Stunning 4K Time-lapse',
      description: 'A beautiful time-lapse video shot in El Teide, Spain\'s highest mountain. Experience the Milky Way in high resolution.',
      thumbnailUrl: 'https://img.youtube.com/vi/y6120QOlsfU/0.jpg',
      channelTitle: 'TSO Photography',
      publishedAt: '2011-04-14T00:00:00Z'
    },
    {
      videoId: 'ScMzIvxBSi4',
      title: 'Building a React App in 10 Minutes',
      description: 'Learn how to build a modern single-page web application using React.js, hooks, and styled-components.',
      thumbnailUrl: 'https://img.youtube.com/vi/ScMzIvxBSi4/0.jpg',
      channelTitle: 'TechAcademy',
      publishedAt: '2022-03-05T00:00:00Z'
    },
    {
      videoId: 'W6NZfCO5SIk',
      title: 'JavaScript Tutorial for Beginners',
      description: 'Learn the fundamentals of JavaScript programming in this crash course designed for absolute beginners.',
      thumbnailUrl: 'https://img.youtube.com/vi/W6NZfCO5SIk/0.jpg',
      channelTitle: 'ProgrammingCode',
      publishedAt: '2021-08-20T00:00:00Z'
    },
    {
      videoId: 'k1Z258YtP28',
      title: 'Angular vs React vs Vue: Which should you choose?',
      description: 'A comprehensive comparison of the top three JavaScript frameworks in 2026. Syntax, features, and popularity analyzed.',
      thumbnailUrl: 'https://img.youtube.com/vi/k1Z258YtP28/0.jpg',
      channelTitle: 'DevWars',
      publishedAt: '2025-12-10T00:00:00Z'
    }
  ];

  // Coincidencia simple de palabras clave
  let filtered = allMockVideos;
  if (query.trim()) {
    const q = query.toLowerCase();
    filtered = allMockVideos.filter(
      v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q)
    );
  }

  // Paginación simulada simple
  const pageSize = 4;
  const startIdx = pageToken === 'page2' ? pageSize : 0;
  const endIdx = startIdx + pageSize;
  const sliced = filtered.slice(startIdx, endIdx);

  const nextPageToken = (filtered.length > endIdx) ? (pageToken === 'page2' ? '' : 'page2') : '';
  const prevPageToken = (startIdx > 0) ? 'page1' : '';

  return {
    videos: sliced,
    nextPageToken,
    prevPageToken
  };
};

// @desc    Buscar videos de YouTube mediante Proxy
// @route   GET /api/videos/search
// @access  Privado
const searchVideos = async (req, res, next) => {
  try {
    const { q = '', pageToken = '' } = req.query;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!apiKey || apiKey === 'YOUR_YOUTUBE_API_KEY') {
      logger.warn('YOUTUBE_API_KEY not configured. Serving mock video search results.');
      const mockResult = getMockVideos(q, pageToken);
      return res.status(200).json({
        success: true,
        source: 'mock',
        ...mockResult
      });
    }

    // Llamar a la API real de YouTube
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 12,
        q: q,
        type: 'video',
        key: apiKey,
        pageToken: pageToken || undefined
      }
    });

    const formattedVideos = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt
    }));

    res.status(200).json({
      success: true,
      source: 'youtube_api',
      videos: formattedVideos,
      nextPageToken: response.data.nextPageToken || '',
      prevPageToken: response.data.prevPageToken || ''
    });
  } catch (error) {
    logger.error('Error fetching from YouTube API: %s', error.response?.data?.error?.message || error.message);
    
    // En caso de errores de cuota de la API o problemas de red, recurrir a los datos simulados en lugar de fallar
    logger.warn('YouTube API call failed. Falling back to mock data.');
    const { q = '', pageToken = '' } = req.query;
    const mockResult = getMockVideos(q, pageToken);
    
    res.status(200).json({
      success: true,
      source: 'mock_fallback',
      message: 'YouTube API request failed, serving fallback data.',
      ...mockResult
    });
  }
};

module.exports = {
  searchVideos
};
