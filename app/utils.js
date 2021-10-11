module.exports = {
  setComponentFont,
};

function setComponentFont(boldFont, lightFont, fontSize, font) {
  if (font !== undefined) {
    if (font.size !== undefined) {
      fontSize = font.size;
    }

    if (font.bold_font !== undefined) {
      boldFont = font.bold_font;
    }
    if (font.light_font !== undefined) {
      lightFont = font.light_font;
    }
  }

  return {
    fontSize: fontSize,
    boldFont: boldFont,
    lightFont: lightFont,
  };
}
