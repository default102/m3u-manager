import { guessChannelGroups, sanitizeChannelNames } from './lib/services/ai';

async function test() {
  const channels = [
    { id: 1, name: 'CCTV-1 综合频道 [电信]' },
    { id: 2, name: '湖南卫视 - 1080P FHD (IPV6)' },
    { id: 3, name: 'HBO HD 电影台' },
    { id: 4, name: '[5G] 凤凰卫视资讯台' },
    { id: 5, name: 'CCTV-5 体育 60帧' }
  ];

  console.log('Testing AI Grouping with channels:', channels);
  try {
    const results = await guessChannelGroups(channels);
    console.log('AI Grouping Results:', results);
  } catch (error) {
    console.error('AI Grouping Error:', error);
  }

  console.log('\nTesting AI Name Sanitization with channels:', channels);
  try {
    const results = await sanitizeChannelNames(channels);
    console.log('AI Sanitization Results:', results);
  } catch (error) {
    console.error('AI Sanitization Error:', error);
  }
}

test();
