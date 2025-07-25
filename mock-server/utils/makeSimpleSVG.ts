export const makeSimpleSVG = (str: string) => `
      <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="150" height="150" fill="#f0f0f0" stroke="#ccc"/>
        <text x="75" y="75" text-anchor="middle" fill="#666" font-size="12">
          Thumbnail ${str}
        </text>
      </svg>
    `;
