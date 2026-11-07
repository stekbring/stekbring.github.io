// Ungefärliga bilder av Apples SF Symbols, bara för förhandsvisningen i webbläsaren.
// På telefonen ritas Apples riktiga ikoner. Ritade i 24 × 24; "f" = fylld, annars linje.
var SF = {
  'house.fill': { f: 1, d: 'M3 11 12 3.5 21 11v9.5h-6v-6H9v6H3z' },
  'house': { d: 'M3 11 12 3.5 21 11M5 9.5V20h5v-6h4v6h5V9.5' },
  'thermometer.medium': { d: 'M14 14.8V4.5a2.5 2.5 0 0 0-5 0v10.3a4.5 4.5 0 1 0 5 0zM11.5 10v7' },
  'thermometer': { d: 'M14 14.8V4.5a2.5 2.5 0 0 0-5 0v10.3a4.5 4.5 0 1 0 5 0z' },
  'thermometer.snowflake': { d: 'M11 14.8V4.5a2.5 2.5 0 0 0-5 0v10.3a4.5 4.5 0 1 0 5 0zM17 4v8M14 6l6 4M20 6l-6 4' },
  'drop.fill': { f: 1, d: 'M12 2.5s6.5 7.2 6.5 12a6.5 6.5 0 0 1-13 0c0-4.8 6.5-12 6.5-12z' },
  'drop': { d: 'M12 2.5s6.5 7.2 6.5 12a6.5 6.5 0 0 1-13 0c0-4.8 6.5-12 6.5-12z' },
  'humidity.fill': { f: 1, d: 'M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z' },
  'wind': { d: 'M3 8h11a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 18h7' },
  'sunrise.fill': { d: 'M5 17a7 7 0 0 1 14 0M2 20h20M12 2v5M9 4.5 12 1.5l3 3M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4' },
  'sunset.fill': { d: 'M5 17a7 7 0 0 1 14 0M2 20h20M12 1.5v5M9 4l3 3 3-3M4.2 10.2l1.4 1.4M19.8 10.2l-1.4 1.4' },
  'sun.max.fill': { d: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4', f2: 1 },
  'sun.horizon.fill': { d: 'M5 16a7 7 0 0 1 14 0M2 19h20M12 4v3M4.9 8.9l1.4 1.4M19.1 8.9l-1.4 1.4' },
  'moon.fill': { f: 1, d: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z' },
  'cloud.fill': { f: 1, d: 'M7 19a5 5 0 0 1-.6-9.96A7 7 0 0 1 19.6 9.5 4.5 4.5 0 0 1 18 19z' },
  'cloud.rain.fill': { d: 'M7 15a5 5 0 0 1-.6-9.96A7 7 0 0 1 19.6 5.5 4.5 4.5 0 0 1 18 15zM8 18l-1 3M12 18l-1 3M16 18l-1 3' },
  'snowflake': { d: 'M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3' },
  'bolt.fill': { f: 1, d: 'M13 2 4 14h7l-1 8 9-12h-7z' },
  'flame.fill': { f: 1, d: 'M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z' },
  'leaf.fill': { f: 1, d: 'M20 4c-9 0-15 4-15 11 0 2 1 4 2 5 1-5 5-9 9-10-4 2-7 6-8 10 8 1 12-6 12-16z' },
  'tree.fill': { f: 1, d: 'M12 2 5 12h4l-4 6h6v4h2v-4h6l-4-6h4z' },
  'battery.100': { bat: 1 }, 'battery.75': { bat: 0.75 }, 'battery.50': { bat: 0.5 }, 'battery.25': { bat: 0.25 }, 'battery.0': { bat: 0 },
  'battery.100.bolt': { bat: 1, blixt: 1 },
  'wifi': { d: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0', prick: [12, 19.5] },
  'wifi.slash': { d: 'M2 9a15 15 0 0 1 20 0M5.5 12.5a10 10 0 0 1 13 0M9 16a5 5 0 0 1 6 0M3 3l18 18' },
  'antenna.radiowaves.left.and.right': { d: 'M12 10v11M8 7a5 5 0 0 0 0 6M16 7a5 5 0 0 1 0 6M5 4a9 9 0 0 0 0 12M19 4a9 9 0 0 1 0 12', prick: [12, 10] },
  'antenna.radiowaves.left.and.right.slash': { d: 'M12 10v11M8 7a5 5 0 0 0 0 6M16 7a5 5 0 0 1 0 6M3 3l18 18' },
  'icloud.and.arrow.up': { d: 'M7 18H6a5 5 0 0 1-.6-9.96A7 7 0 0 1 19 7.5a4.5 4.5 0 0 1 .5 8.97M12 21v-9M9 15l3-3 3 3' },
  'exclamationmark.icloud': { d: 'M7 19H6a5 5 0 0 1-.6-9.96A7 7 0 0 1 19 8.5a4.5 4.5 0 0 1-1 9H16M12 10v5', prick: [12, 18.5] },
  'exclamationmark.triangle.fill': { f: 1, d: 'M12 2.5 22.5 21h-21z', hal: 'M12 9v5.5M12 17.6v.2' },
  'checkmark.circle.fill': { f: 1, d: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z', hal: 'M7.5 12.5l3 3 6-6.5' },
  'checkmark': { d: 'M4 12.5l5 5L20 6.5' },
  'xmark': { d: 'M5 5l14 14M19 5 5 19' },
  'clock': { d: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3.5 2' },
  'clock.arrow.circlepath': { d: 'M4 12a8 8 0 1 0 2.3-5.7M4 4v4h4M12 8v4l3 2' },
  'calendar': { d: 'M4 6h16v15H4zM4 10h16M8 3v5M16 3v5' },
  'bell.fill': { f: 1, d: 'M12 3a6 6 0 0 0-6 6v5l-2 3h16l-2-3V9a6 6 0 0 0-6-6zM10 20a2 2 0 0 0 4 0' },
  'heart.fill': { f: 1, d: 'M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z' },
  'star.fill': { f: 1, d: 'M12 2.5l2.9 6.2 6.6.6-5 4.5 1.5 6.7L12 17l-6 3.5 1.5-6.7-5-4.5 6.6-.6z' },
  'lightbulb.fill': { f: 1, d: 'M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2zM9 19.5h6M10 22h4' },
  'lock.fill': { f: 1, d: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4' },
  'location.fill': { f: 1, d: 'M21 3 3 10.5l8 2.5 2.5 8z' },
  'arrow.right': { d: 'M4 12h15M13 6l6 6-6 6' },
  'arrow.left': { d: 'M20 12H5M11 6l-6 6 6 6' },
  'arrow.up': { d: 'M12 20V5M6 11l6-6 6 6' },
  'arrow.down': { d: 'M12 4v15M6 13l6 6 6-6' },
  'arrow.up.right': { d: 'M6 18 18 6M8 6h10v10' },
  'arrow.down.right': { d: 'M6 6l12 12M18 8v10H8' },
  'gauge': { d: 'M4 17a8 8 0 1 1 16 0M12 17l4-6' },
  'chart.line.uptrend.xyaxis': { d: 'M3 3v18h18M6 15l4-4 3 3 6-7' },
  'person.fill': { f: 1, d: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 21a8 8 0 0 1 16 0z' },
  'car.fill': { f: 1, d: 'M5 11l2-5h10l2 5h1v6h-2v2h-3v-2H9v2H6v-2H4v-6z' },
  'figure.walk': { d: 'M13 4.5a1.5 1.5 0 1 0 0-.1M10 21l2-6 3 3v3M9 12l2-4 3 1 2 3M12 8l-1 4' },
  'music.note': { d: 'M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z' },
  'calendar.badge.clock': { d: 'M4 6h16v8M4 6v15h8M4 10h16M8 3v5M16 3v5M18 15a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM18 17v2l1 1' },
  'sensor.fill': { f: 1, d: 'M6 4h12v16H6z', hal: 'M9 9a4 4 0 0 1 6 0M10.5 11.5a2 2 0 0 1 3 0' },
  'questionmark.square': { d: 'M4 4h16v16H4zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.7M12 17v.2' },
}
var SF_NAMN = Object.keys(SF).filter(function (n) { return n !== 'questionmark.square' })

// SVG-markup för ett ikonnamn i given storlek och färg
function sfSvg(namn, storlek, farg) {
  var s = SF[namn] || SF['questionmark.square'], st = storlek, c = farg || 'currentColor'
  var h = '<svg width="' + st + '" height="' + st + '" viewBox="0 0 24 24" fill="none" stroke="' + c + '" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  if (s.bat !== undefined) {
    h += '<rect x="1.5" y="7" width="18" height="10" rx="3" stroke-width="1.6"/><path d="M21.5 10.5v3" stroke-width="2"/>'
    if (s.bat > 0) h += '<rect x="3.5" y="9" width="' + (14 * s.bat).toFixed(1) + '" height="6" rx="1.5" fill="' + c + '" stroke="none"/>'
    if (s.blixt) h += '<path d="M11.5 8 8.5 12.5h3l-1 3.5 3.5-5h-3z" fill="' + c + '" stroke="#000" stroke-width=".6"/>'
  } else if (s.f) {
    h += '<path d="' + s.d + '" fill="' + c + '" stroke="none"/>'
    if (s.hal) h += '<path d="' + s.hal + '" stroke="#000" stroke-opacity=".75" stroke-width="2.2"/>'
  } else {
    h += '<path d="' + s.d + '"/>'
  }
  if (s.prick) h += '<circle cx="' + s.prick[0] + '" cy="' + s.prick[1] + '" r="1.6" fill="' + c + '" stroke="none"/>'
  if (!SF[namn]) h += '<title>' + String(namn).replace(/[<&"]/g, '') + ' (visas som Apples riktiga ikon på telefonen)</title>'
  return h + '</svg>'
}
