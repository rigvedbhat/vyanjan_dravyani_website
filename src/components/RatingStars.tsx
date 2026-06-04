type RatingStarsProps = {
  rating: number;
  label?: string;
};

export function RatingStars({ rating, label }: RatingStarsProps) {
  const rounded = Math.round(rating);

  return (
    <span className="rating" aria-label={label ?? `${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">
          {index < rounded ? "★" : "☆"}
        </span>
      ))}
    </span>
  );
}
