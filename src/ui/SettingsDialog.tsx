import { useEffect } from 'preact/hooks'
import { signOut } from '../auth/token'
import { DAILY_QUOTA } from '../config'
import type { Role } from '../domain/types'
import { loadMyPlaylists, myPlaylists, myPlaylistsError, refreshRole, ROLES } from '../state/playlists'
import { msUntilPacificMidnight, quota } from '../state/quota'
import { isWritable, setPlaylist, setWritable, settings } from '../state/settings'
import { Dialog } from './Dialog'
import { count, duration, ITEMS, num, sentences } from './format'
import { Icon } from './icons'
import { dialog, ROLE_LABEL } from './ui'

const HINT: Record<Role, string> = {
  tracks: 'Автосгенерированные музыкальные треки с обложкой альбома. Сортировка: первый исполнитель → альбом → название',
  music: 'Любые другие видео: клипы, лайвы, пользовательские видео. Сортировка: по названию'
}

function RoleSettings({ role }: { role: Role }) {
  const selected = settings.value.playlists[role]
  const other = settings.value.playlists[role === 'tracks' ? 'music' : 'tracks']
  const list = myPlaylists.value
  const writable = selected ? isWritable(selected) : false
  return (
    <fieldset class="field">
      <legend class="field__label">Плейлист «{ROLE_LABEL[role]}»</legend>
      <p class="field__hint">{HINT[role]}</p>
      <select
        class="select"
        value={selected ?? ''}
        disabled={!list}
        onChange={e => {
          setPlaylist(role, e.currentTarget.value || undefined)
          refreshRole(role)
        }}
      >
        <option value="">{list ? '— не выбран —' : 'Загрузка…'}</option>
        {list?.map(p => (
          <option key={p.id} value={p.id}>
            {p.snippet.title}
            {p.contentDetails ? ` · ${count(p.contentDetails.itemCount, ITEMS)}` : ''}
          </option>
        ))}
        {selected && list && !list.some(p => p.id === selected) && <option value={selected}>{selected}</option>}
      </select>
      {selected && selected === other && (
        <div class="alert alert--warn">
          <Icon name="warning" size={18} />
          <span>Этот же плейлист выбран и для второй роли</span>
        </div>
      )}
      {selected && (
        <label class="toggle">
          <input type="checkbox" {...{ switch: true }} checked={writable} onChange={e => setWritable(selected, e.currentTarget.checked)} />
          <span class="toggle__track" />
          <span>
            Разрешить запись в этот плейлист
            <small>{writable ? 'Приложение может перемещать, добавлять и удалять элементы после вашего подтверждения' : 'Сейчас только чтение: приложение показывает планы, но ничего не меняет'}</small>
          </span>
        </label>
      )}
    </fieldset>
  )
}

function QuotaSettings() {
  const q = quota.value
  const pct = q.exhausted ? 100 : Math.min(100, (q.used / DAILY_QUOTA) * 100)
  return (
    <fieldset class="field">
      <legend class="field__label">Квота YouTube Data API</legend>
      <div class={`quota${q.exhausted ? ' quota--exhausted' : ''}`}>
        <div class="quota__text">
          <span>Потрачено сегодня</span>
          <span>
            {num(q.used)} из {num(DAILY_QUOTA)}
          </span>
        </div>
        <div class="quota__bar">
          <div style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p class="field__hint">{sentences(q.exhausted && 'API сообщил, что квота исчерпана', `Сброс через ${duration(msUntilPacificMidnight())}, в полночь по тихоокеанскому времени`)}</p>
    </fieldset>
  )
}

export function SettingsDialog() {
  useEffect(() => {
    loadMyPlaylists()
  }, [])
  const close = () => (dialog.value = null)
  return (
    <Dialog
      title="Настройки"
      onClose={close}
      footer={
        <>
          <button
            class="btn btn--ghost"
            onClick={() => {
              close()
              signOut()
            }}
          >
            <Icon name="logout" size={20} />
            Выйти
          </button>
          <button class="btn btn--primary" onClick={close}>
            Готово
          </button>
        </>
      }
    >
      {myPlaylistsError.value && (
        <div class="alert alert--error">
          <Icon name="warning" size={18} />
          <span>{myPlaylistsError.value}</span>
          <button class="btn btn--text" onClick={loadMyPlaylists}>
            Повторить
          </button>
        </div>
      )}
      {ROLES.map(role => (
        <RoleSettings key={role} role={role} />
      ))}
      <QuotaSettings />
      <div class="note">
        <Icon name="warning" size={18} />
        <span>
          Для первой проверки записи создайте отдельный тестовый плейлист (15–20 треков и клипов вперемешку), выберите его вместо настоящего и разрешите запись только ему. Порядок сортировки плейлиста на YouTube должен быть «Вручную»
        </span>
      </div>
      <button class="btn btn--text" onClick={loadMyPlaylists}>
        <Icon name="refresh" size={18} />
        Обновить список плейлистов
      </button>
      <p class="muted small">Версия {__APP_VERSION__}</p>
    </Dialog>
  )
}
