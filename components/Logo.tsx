export function Logo() {
  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 420 110" className="h-24 w-[320px] sm:h-28 sm:w-[380px]" role="img" aria-label="我不识字">
        <text
          x="210"
          y="74"
          textAnchor="middle"
          style={{
            fontFamily: '"STKaiti", "KaiTi", "DFKai-SB", "cursive"',
            fontSize: 68,
            fill: "#2d2925",
            letterSpacing: "2px"
          }}
        >
          我不识字
        </text>
      </svg>
    </div>
  );
}
