// iPhone-modeller och widgetstorlekar i punkter (pt). Värdena följer Apples tabeller för
// widgetstorlekar; för modeller där Apple inte publicerat exakta mått är de uppskattade.
// lasKant: hur mycket av låsskärmsrektangelns bredd iOS själv använder för text
// (uppmätt på Olles iPhone: ungefär 77 %).
var ENHETER = [
  { id: 'se3', namn: 'iPhone SE (2:a/3:e gen)', w: 375, h: 667, liten: 148, mellan: 321, stor: 324, rund: 68, rektW: 153, rektH: 66, notch: false },
  { id: 'mini', namn: 'iPhone 12/13 mini', w: 375, h: 812, liten: 155, mellan: 329, stor: 345, rund: 68, rektW: 157, rektH: 66 },
  { id: 'i11', namn: 'iPhone 11 / XR', w: 414, h: 896, liten: 169, mellan: 360, stor: 379, rund: 72, rektW: 160, rektH: 72 },
  { id: 'i12', namn: 'iPhone 12/13/14, 12/13 Pro', w: 390, h: 844, liten: 158, mellan: 338, stor: 354, rund: 72, rektW: 160, rektH: 72 },
  { id: 'i15', namn: 'iPhone 14 Pro, 15, 15 Pro, 16, 16e', w: 393, h: 852, liten: 158, mellan: 338, stor: 354, rund: 72, rektW: 160, rektH: 72, di: true },
  { id: 'i16p', namn: 'iPhone 16 Pro, 17, 17 Pro', w: 402, h: 874, liten: 162, mellan: 345, stor: 363, rund: 74, rektW: 164, rektH: 74, di: true },
  { id: 'air', namn: 'iPhone Air', w: 420, h: 912, liten: 167, mellan: 357, stor: 375, rund: 76, rektW: 170, rektH: 76, di: true },
  { id: 'pmax', namn: 'iPhone 12/13 Pro Max, 14 Plus', w: 428, h: 926, liten: 170, mellan: 364, stor: 382, rund: 76, rektW: 172, rektH: 76 },
  { id: 'i15pm', namn: 'iPhone 14/15 Pro Max, 15/16 Plus', w: 430, h: 932, liten: 170, mellan: 364, stor: 382, rund: 76, rektW: 172, rektH: 76, di: true },
  { id: 'i16pm', namn: 'iPhone 16/17 Pro Max', w: 440, h: 956, liten: 170, mellan: 364, stor: 382, rund: 76, rektW: 172, rektH: 76, di: true },
]

var FAMILJER = [
  { id: 'small', namn: 'Liten (2 × 2)', las: false },
  { id: 'medium', namn: 'Mellan (4 × 2)', las: false },
  { id: 'large', namn: 'Stor (4 × 4)', las: false },
  { id: 'accessoryCircular', namn: 'Låsskärm rund', las: true },
  { id: 'accessoryRectangular', namn: 'Låsskärm rektangel', las: true },
  { id: 'accessoryInline', namn: 'Låsskärm rad ovanför klockan', las: true },
]

// Widgetens yttre mått för en familj på en enhet
function widgetMatt(enhet, familj) {
  var e = enhet
  switch (familj) {
    case 'small': return { w: e.liten, h: e.liten, radie: 22 }
    case 'medium': return { w: e.mellan, h: e.liten, radie: 22 }
    case 'large': return { w: e.mellan, h: e.stor, radie: 22 }
    case 'accessoryCircular': return { w: e.rund, h: e.rund, radie: e.rund / 2 }
    case 'accessoryRectangular': return { w: e.rektW, h: e.rektH, radie: 12 }
    case 'accessoryInline': return { w: Math.round(e.w * 0.62), h: 20, radie: 0 }
  }
  return { w: e.liten, h: e.liten, radie: 22 }
}
// Scriptables standardluft runt innehållet när widgeten inte anger egen
function standardPadding(familj) { return /^accessory/.test(familj) ? [0, 0, 0, 0] : [16, 16, 16, 16] }
