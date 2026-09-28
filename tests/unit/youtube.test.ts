import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl } from '../../src/lib/youtube';

describe('parseYouTubeUrl', () => {
  it.each([
    ['https://www.youtube.com/watch?v=tBTNMo77h2Q', { id: 'tBTNMo77h2Q' }],
    ['https://youtube.com/watch?v=p-LY9b1u_io', { id: 'p-LY9b1u_io' }],
    ['https://m.youtube.com/watch?v=tBTNMo77h2Q', { id: 'tBTNMo77h2Q' }],
    ['https://www.youtube.com/watch?v=vmuLzYet9K4&pp=ygUPbWV4aWNhbiByZWNpcGVz', { id: 'vmuLzYet9K4' }],
    ['https://www.youtube.com/watch?v=AAkotB7wyUg&t=2s', { id: 'AAkotB7wyUg', start: 2 }],
    ['https://youtu.be/z-AI4ZalbR4?t=297', { id: 'z-AI4ZalbR4', start: 297 }],
    ['https://youtu.be/HIY0LPBAtgk?t=1m30s', { id: 'HIY0LPBAtgk', start: 90 }],
    ['https://www.youtube.com/shorts/tBTNMo77h2Q', { id: 'tBTNMo77h2Q' }],
    ['https://www.youtube.com/watch?v=tBTNMo77h2Q&start=15', { id: 'tBTNMo77h2Q', start: 15 }],
  ])('%s', (url, expected) => {
    expect(parseYouTubeUrl(url)).toEqual(expected);
  });

  it.each([
    'https://natashaskitchen.com/blueberry-muffins-with-lemon-glaze/',
    'https://www.youtube.com/@channel',
    'https://www.youtube.com/watch?v=short',
    'https://evil.example/watch?v=tBTNMo77h2Q',
    'https://youtube.com.evil.example/watch?v=tBTNMo77h2Q',
    'not a url',
  ])('rejects %s', (url) => {
    expect(parseYouTubeUrl(url)).toBeNull();
  });

  it('ignores an unparseable start time', () => {
    expect(parseYouTubeUrl('https://youtu.be/z-AI4ZalbR4?t=abc')).toEqual({ id: 'z-AI4ZalbR4' });
  });
});
