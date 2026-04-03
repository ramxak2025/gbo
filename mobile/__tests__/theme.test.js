import { getColors, colors } from '../src/utils/theme';

describe('Theme', () => {
  test('getColors returns dark colors when dark=true', () => {
    const c = getColors(true);
    expect(c.bg).toBe('#050505');
    expect(c.text).toBe('#ffffff');
    expect(c.purple).toBe('#8b5cf6');
  });

  test('getColors returns light colors when dark=false', () => {
    const c = getColors(false);
    expect(c.bg).toBe('#f5f5f7');
    expect(c.text).toBe('#111827');
    expect(c.purple).toBe('#7c3aed');
  });

  test('both themes have all required color keys', () => {
    const requiredKeys = [
      'bg', 'card', 'text', 'textSecondary', 'textTertiary',
      'glass', 'glassBorder', 'purple', 'purpleBg',
      'green', 'greenBg', 'red', 'redBg', 'blue', 'blueBg',
      'yellow', 'yellowBg', 'accent', 'tabBar', 'tabBarBorder',
      'inputBg', 'inputBorder', 'placeholder',
    ];
    for (const key of requiredKeys) {
      expect(colors.dark).toHaveProperty(key);
      expect(colors.light).toHaveProperty(key);
    }
  });
});
