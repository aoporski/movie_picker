const adjustPreferencesBasedOnFeedback = (feedback, movieDetails) => {
  const { genres = [], actors = [], directors = [] } = movieDetails;
  const adjustment = { actors: {}, directors: {}, genres: {} };

  let modifier = 0;
  if (feedback === "liked" || feedback === "this_one") modifier = 1.0;
  else if (feedback === "save_for_later") modifier = 0.8;
  else if (feedback === "ok") modifier = 0.1;
  else if (feedback === "not_this_one") modifier = -0.6;
  else if (feedback === "disliked") modifier = -1.0;

  genres.forEach((g) => (adjustment.genres[g] = modifier));
  actors.forEach((a) => (adjustment.actors[a] = modifier));
  directors.forEach((d) => (adjustment.directors[d] = modifier));

  return adjustment;
};

module.exports = { adjustPreferencesBasedOnFeedback };
