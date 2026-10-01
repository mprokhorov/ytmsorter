import { useState } from 'preact/hooks'
import type { Kind } from '../domain/types'
import { addToArchive, parseVideoId, updateArchiveEntry, type ArchiveEntry } from '../state/library'
import { entryThumbs } from './ArchiveView'
import { Cover } from './Cover'
import { Dialog } from './Dialog'
import { dialog, showToast } from './ui'

interface Props {
  entry?: ArchiveEntry
  prefill?: Partial<ArchiveEntry>
}

export function ArchiveForm({ entry, prefill }: Props) {
  const base = entry ?? prefill ?? {}
  const [title, setTitle] = useState(base.title ?? '')
  const [artist, setArtist] = useState(base.artist ?? '')
  const [album, setAlbum] = useState(base.album ?? '')
  const [kind, setKind] = useState<Kind>(base.kind ?? 'track')
  const [link, setLink] = useState(base.videoId ?? '')
  const [note, setNote] = useState(base.note ?? '')
  const videoId = parseVideoId(link)
  const linkInvalid = link.trim() !== '' && !videoId
  const close = () => (dialog.value = null)

  const submit = (e: Event) => {
    e.preventDefault()
    if (!title.trim() || linkInvalid) return
    const data = { title: title.trim(), artist: artist.trim(), album: album.trim(), kind, videoId, note: note.trim() || undefined }
    if (entry) {
      updateArchiveEntry(entry.id, { ...data, thumb: videoId === entry.videoId ? entry.thumb : undefined })
      showToast('Запись обновлена')
    } else {
      addToArchive({ ...data, source: 'manual', thumb: prefill?.thumb, role: prefill?.role, channel: prefill?.channel })
      showToast('Добавлено в архив')
    }
    close()
  }

  return (
    <Dialog
      title={entry ? 'Изменить запись' : 'Добавить в архив'}
      onClose={close}
      footer={
        <>
          <button class="btn btn--ghost" onClick={close}>
            Отмена
          </button>
          <button class="btn btn--primary" type="button" disabled={!title.trim() || linkInvalid} onClick={submit}>
            Сохранить
          </button>
        </>
      }
    >
      <form id="archive-form" class="form" onSubmit={submit}>
        <div class="form__preview">
          <Cover thumbs={entryThumbs({ videoId, thumb: videoId === base.videoId ? base.thumb : undefined })} shape="square" size={72} kind={kind} />
          <div class="segmented">
            <button type="button" class={kind === 'track' ? 'is-active' : ''} onClick={() => setKind('track')}>
              Трек
            </button>
            <button type="button" class={kind === 'music' ? 'is-active' : ''} onClick={() => setKind('music')}>
              Музыка
            </button>
          </div>
        </div>
        <label class="input">
          <span>Название *</span>
          <input value={title} required onInput={e => setTitle(e.currentTarget.value)} />
        </label>
        <label class="input">
          <span>{kind === 'track' ? 'Исполнитель' : 'Автор / канал'}</span>
          <input value={artist} onInput={e => setArtist(e.currentTarget.value)} />
        </label>
        <label class="input">
          <span>Альбом</span>
          <input value={album} onInput={e => setAlbum(e.currentTarget.value)} />
        </label>
        <label class="input">
          <span>Ссылка на YouTube или ID видео</span>
          <input value={link} placeholder="https://music.youtube.com/watch?v=…" onInput={e => setLink(e.currentTarget.value)} />
          {linkInvalid && <small class="input__error">Не удалось распознать ссылку</small>}
        </label>
        <label class="input">
          <span>Заметка</span>
          <textarea rows={2} value={note} onInput={e => setNote(e.currentTarget.value)} />
        </label>
      </form>
    </Dialog>
  )
}
