import json
import random
from pathlib import Path


class Track:
    def __init__(self, artist, name, album, index):
        self.artist = artist
        self.name = name
        self.album = album
        self.index = index


def sort_music_key(track):
    return track.name.lower(), str(not track.name[-1].isupper())


def sort_tracks_key(track):
    return (track.artist.lower(), str(not track.artist[-1].isupper()),
            track.album.lower(), str(not track.album[-1].isupper()),
            track.name.lower(), str(not track.name[-1].isupper()))


ALPHABET = list('aAbBzZ') + list('аАбБяЯёЁеЕ') + list('019 ()!-.·') + ['ß', 'İ', 'Ⓐ', 'ǅ', '\U0001D400', '\U0001F600', 'Ａ', 'Σ', 'σ', 'ς']
POOL = ['Adele', 'adele', 'ADELE', 'Кино', 'КИНО', 'кино', 'Ария', 'AC/DC', '5\'nizza', 'Би-2', 'Björk', 'Мумий Тролль']


def word(rng):
    if rng.random() < 0.4:
        base = rng.choice(POOL)
        if rng.random() < 0.3:
            base += rng.choice(ALPHABET)
        return base
    return ''.join(rng.choice(ALPHABET) for _ in range(rng.randint(1, 5)))


def main():
    rng = random.Random(20260929)
    tracks = [Track(word(rng), word(rng), word(rng), i) for i in range(600)]
    music = sorted(tracks, key=sort_music_key)
    full = sorted(tracks, key=sort_tracks_key)
    data = {
        'items': [{'artist': t.artist, 'album': t.album, 'title': t.name} for t in tracks],
        'music': [t.index for t in music],
        'tracks': [t.index for t in full],
    }
    out = Path(__file__).with_name('sort.json')
    out.write_text(json.dumps(data, ensure_ascii=False), encoding='utf-8')


if __name__ == '__main__':
    main()
