const fixed = (value) => ({ a: 0, k: value });

const animated = (keyframes) => ({
  a: 1,
  k: keyframes.map((keyframe, index) => ({
    t: keyframe.frame,
    s: keyframe.value,
    ...(index < keyframes.length - 1
      ? { o: { x: [0.32], y: [0] }, i: { x: [0.68], y: [1] } }
      : {}),
  })),
});

const transform = (position = [0, 0], scale = [100, 100], rotation = 0) => ({
  ty: 'tr',
  p: fixed(position),
  a: fixed([0, 0]),
  s: fixed(scale),
  r: fixed(rotation),
  o: fixed(100),
  sk: fixed(0),
  sa: fixed(0),
  nm: 'Transform',
});

const group = (name, position, shapes) => ({
  ty: 'gr',
  it: [...shapes, transform(position)],
  nm: name,
});

const rectangle = (name, size, radius, color, position, opacity = 100, outline) => {
  const shapes = [
    { ty: 'rc', d: 1, s: fixed(size), p: fixed([0, 0]), r: fixed(radius), nm: `${name} path` },
    { ty: 'fl', c: fixed(color), o: fixed(opacity), r: 1, bm: 0, nm: `${name} fill` },
  ];

  if (outline) {
    shapes.push({
      ty: 'st',
      c: fixed(outline.color),
      o: fixed(outline.opacity ?? 100),
      w: fixed(outline.width),
      lc: 2,
      lj: 2,
      ml: 4,
      bm: 0,
      nm: `${name} outline`,
    });
  }

  return group(name, position, shapes);
};

const ellipse = (name, size, color, position, opacity = 100, outline) => {
  const shapes = [
    { ty: 'el', d: 1, s: fixed(size), p: fixed([0, 0]), nm: `${name} path` },
  ];

  if (color) {
    shapes.push({ ty: 'fl', c: fixed(color), o: fixed(opacity), r: 1, bm: 0, nm: `${name} fill` });
  }

  if (outline) {
    shapes.push({
      ty: 'st',
      c: fixed(outline.color),
      o: fixed(outline.opacity ?? 100),
      w: fixed(outline.width),
      lc: 2,
      lj: 2,
      ml: 4,
      bm: 0,
      nm: `${name} outline`,
    });
  }

  return group(name, position, shapes);
};

const pathShape = (name, vertices, color, width) => ({
  ty: 'gr',
  it: [
    {
      ty: 'sh',
      ks: fixed({
        c: false,
        v: vertices,
        i: vertices.map(() => [0, 0]),
        o: vertices.map(() => [0, 0]),
      }),
      nm: `${name} path`,
    },
    { ty: 'st', c: fixed(color), o: fixed(100), w: fixed(width), lc: 2, lj: 2, ml: 4, bm: 0, nm: `${name} stroke` },
    transform(),
  ],
  nm: name,
});

const layer = (index, name, shapes, options = {}) => ({
  ddd: 0,
  ind: index,
  ty: 4,
  nm: name,
  sr: 1,
  ks: {
    o: options.opacity || fixed(100),
    r: options.rotation || fixed(0),
    p: options.position || fixed([110, 110, 0]),
    a: fixed([0, 0, 0]),
    s: options.scale || fixed([100, 100, 100]),
  },
  ao: 0,
  shapes,
  ip: 0,
  op: 120,
  st: 0,
  bm: 0,
});

const star = (index, name, color, position, scaleKeyframes) => layer(index, name, [
  group(name, [0, 0], [
    {
      ty: 'sh',
      ks: fixed({
        c: true,
        v: [[0, -9], [2, -2], [9, 0], [2, 2], [0, 9], [-2, 2], [-9, 0], [-2, -2]],
        i: Array.from({ length: 8 }, () => [0, 0]),
        o: Array.from({ length: 8 }, () => [0, 0]),
      }),
      nm: `${name} path`,
    },
    { ty: 'fl', c: fixed(color), o: fixed(100), r: 1, bm: 0, nm: `${name} fill` },
  ]),
], {
  position: fixed([position[0], position[1], 0]),
  opacity: animated([
    { frame: 0, value: [35] },
    { frame: 24, value: [100] },
    { frame: 48, value: [35] },
    { frame: 72, value: [100] },
    { frame: 96, value: [35] },
    { frame: 120, value: [35] },
  ]),
  rotation: animated([
    { frame: 0, value: [0] },
    { frame: 60, value: [24] },
    { frame: 120, value: [0] },
  ]),
  scale: animated(scaleKeyframes),
});

const checkBadge = [
  ellipse('Success badge', [36, 36], [0.31, 0.53, 0.37, 1], [0, 0]),
  group('White check', [0, 0], [
    pathShape('Check mark', [[-7, 0], [-2, 5], [7, -6]], [1, 1, 1, 1], 2.8),
  ]),
];

const animation = {
  v: '5.7.4',
  fr: 30,
  ip: 0,
  op: 120,
  w: 220,
  h: 220,
  nm: 'Quiz preparation',
  ddd: 0,
  assets: [],
  layers: [
    layer(1, 'Soft halo', [ellipse('Halo', [162, 162], [0.91, 0.95, 0.92, 1], [0, 0], 52)], {
      position: fixed([110, 110, 0]),
      scale: animated([
        { frame: 0, value: [96, 96, 100] },
        { frame: 60, value: [104, 104, 100] },
        { frame: 120, value: [96, 96, 100] },
      ]),
      opacity: animated([
        { frame: 0, value: [42] },
        { frame: 60, value: [20] },
        { frame: 120, value: [42] },
      ]),
    }),
    layer(2, 'Orbit path', [ellipse('Orbit', [158, 158], null, [0, 0], 100, {
      color: [0.79, 0.86, 0.81, 1],
      opacity: 70,
      width: 1.6,
    })]),
    layer(3, 'Orbiting green accent', [ellipse('Green accent', [11, 11], [0.34, 0.57, 0.4, 1], [0, -79])], {
      position: fixed([110, 110, 0]),
      rotation: animated([
        { frame: 0, value: [0] },
        { frame: 120, value: [360] },
      ]),
    }),
    layer(4, 'Orbiting gold accent', [ellipse('Gold accent', [7, 7], [0.83, 0.66, 0.32, 1], [0, -79])], {
      position: fixed([110, 110, 0]),
      rotation: animated([
        { frame: 0, value: [110] },
        { frame: 120, value: [-250] },
      ]),
    }),
    star(5, 'Left sparkle', [0.79, 0.62, 0.31, 1], [39, 76], [
      { frame: 0, value: [60, 60, 100] },
      { frame: 24, value: [100, 100, 100] },
      { frame: 48, value: [60, 60, 100] },
      { frame: 72, value: [100, 100, 100] },
      { frame: 96, value: [60, 60, 100] },
      { frame: 120, value: [60, 60, 100] },
    ]),
    star(6, 'Right sparkle', [0.57, 0.46, 0.78, 1], [182, 142], [
      { frame: 0, value: [78, 78, 100] },
      { frame: 30, value: [100, 100, 100] },
      { frame: 60, value: [78, 78, 100] },
      { frame: 90, value: [100, 100, 100] },
      { frame: 120, value: [78, 78, 100] },
    ]),
    layer(7, 'Floating quiz card', [
      rectangle('Quiz card', [108, 132], 15, [1, 1, 0.99, 1], [0, 0], 100, {
        color: [0.84, 0.89, 0.85, 1],
        width: 1.8,
      }),
      ellipse('Header icon', [14, 14], [0.49, 0.39, 0.72, 1], [-36, -43]),
      rectangle('Header label', [46, 5], 2.5, [0.53, 0.61, 0.55, 1], [13, -43]),
      rectangle('Header divider', [82, 2], 1, [0.89, 0.92, 0.89, 1], [0, -24]),
      ellipse('First answer marker', [10, 10], [0.82, 0.87, 0.83, 1], [-35, -7]),
      rectangle('First answer line', [48, 4], 2, [0.76, 0.81, 0.77, 1], [8, -7]),
      rectangle('Selected answer row', [92, 25], 8, [0.91, 0.96, 0.92, 1], [0, 20]),
      ellipse('Selected answer marker', [11, 11], [0.35, 0.58, 0.41, 1], [-35, 20]),
      rectangle('Selected answer line', [38, 4], 2, [0.43, 0.62, 0.47, 1], [6, 20]),
      ellipse('Last answer marker', [10, 10], [0.82, 0.87, 0.83, 1], [-35, 48]),
      rectangle('Last answer line', [41, 4], 2, [0.76, 0.81, 0.77, 1], [7, 48]),
    ], {
      position: animated([
        { frame: 0, value: [110, 112, 0] },
        { frame: 60, value: [110, 106, 0] },
        { frame: 120, value: [110, 112, 0] },
      ]),
      rotation: animated([
        { frame: 0, value: [-1.5] },
        { frame: 60, value: [1.5] },
        { frame: 120, value: [-1.5] },
      ]),
    }),
    layer(8, 'Success check badge', checkBadge, {
      position: fixed([153, 161, 0]),
      scale: animated([
        { frame: 0, value: [88, 88, 100] },
        { frame: 18, value: [104, 104, 100] },
        { frame: 34, value: [100, 100, 100] },
        { frame: 80, value: [100, 100, 100] },
        { frame: 98, value: [88, 88, 100] },
        { frame: 120, value: [88, 88, 100] },
      ]),
    }),
  ],
};

export default animation;
