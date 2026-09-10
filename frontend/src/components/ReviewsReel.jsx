import { TESTIMONIALS, AVATARS } from "@/data/shop";
import { Star } from "@/components/Icons";

const ReviewCard = ({ t, i }) => (
  <div className="review-card" data-testid={`review-${i}`}>
    <div>
      <div className="review-stars">
        {Array.from({ length: 5 }).map((_, k) => (
          <Star key={k} cls={k < t.rating ? "filled" : "empty"} />
        ))}
      </div>
      <p className="review-quote">"{t.quote}"</p>
    </div>
    <div className="review-person">
      <img className="review-avatar" src={AVATARS[i % AVATARS.length]} alt="" />
      <div>
        <div className="review-name">{t.name}</div>
        <div className="review-city">{t.city}</div>
      </div>
    </div>
  </div>
);

// Two auto-scrolling rows of customer reviews (matches the home page reel).
export const ReviewsReel = () => {
  const rowA = [...TESTIMONIALS, ...TESTIMONIALS];
  const reversed = TESTIMONIALS.slice().reverse();
  const rowB = [...reversed, ...reversed];

  return (
    <>
      <div className="reel-wrap">
        <div className="reel-fade reel-fade-left" />
        <div className="reel-fade reel-fade-right" />
        <div className="reel-row reel-track">
          {rowA.map((t, i) => <ReviewCard key={i} t={t} i={i} />)}
        </div>
      </div>
      <div className="reel-wrap reel-wrap-b">
        <div className="reel-fade reel-fade-left" />
        <div className="reel-fade reel-fade-right" />
        <div className="reel-row reel-track reel-track-b">
          {rowB.map((t, i) => <ReviewCard key={i} t={t} i={i + 100} />)}
        </div>
      </div>
    </>
  );
};
