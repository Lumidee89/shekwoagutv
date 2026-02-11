import api from '../api/axios';

export interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  releaseYear: number;
  duration: number;
  videoUrl: string;
  thumbnailUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

export const movieService = {
  // Get all movies
  getAllMovies: async () => {
    const response = await api.get('/movies');
    return response.data.data.movies;
  },

  // Get single movie
  getMovie: async (id: string) => {
    const response = await api.get(`/movies/${id}`);
    return response.data.data.movie;
  },

  // Get featured movies
  getFeaturedMovies: async () => {
    const movies = await movieService.getAllMovies();
    return movies.filter((movie: Movie) => movie.isFeatured === true);
  },

  // Get trending movies (newest first)
  getTrendingMovies: async (limit: number = 10) => {
    const movies = await movieService.getAllMovies();
    return movies
      .sort((a: Movie, b: Movie) => b.releaseYear - a.releaseYear)
      .slice(0, limit);
  },

  // Search movies
  searchMovies: async (query: string) => {
    const movies = await movieService.getAllMovies();
    return movies.filter((movie: Movie) => 
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.genre.some(g => g.toLowerCase().includes(query.toLowerCase()))
    );
  },

  // Get movies by genre
  getMoviesByGenre: async (genre: string) => {
    const movies = await movieService.getAllMovies();
    return movies.filter((movie: Movie) => 
      movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    );
  },
};