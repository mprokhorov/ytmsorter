import { useEffect } from 'preact/hooks'
import { signOut } from '../auth/token'
import type { Role } from '../domain/types'
import { loadMyPlaylists, myPlaylists, myPlaylistsError, refreshRole, ROLES } from '../state/playlists'
import { isWritable, setPlaylist, setWritable, settings } from '../state/settings'
import { Dialog } from './Dialog'
import { haptic, hapticsSupport, type HapticsSupport } from './haptics'
import { count, ITEMS } from './format'
import { Icon } from './icons'
import { dialog, ROLE_LABEL } from './ui'

const HAPTICS_LABEL: Record<HapticsSupport, string> = {
  switch: 'поддерживается (iOS 18+, включите «Системную тактильную отдачу» в настройках звуков)',
  vibrate: 'поддерживается',
  none: 'не поддерживается этим устройством или версией iOS'
}

const HINT: Record<Role, string> = {
  tracks: 'Автосгенерированные музыкальные треки с обложкой альбома. Сортировка: первый исполнитель → альбом → название.',
  music: 'Любые другие видео: клипы, лайвы, пользовательские видео. Сортировка: по названию.'
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
          <span>Этот же плейлист выбран и для второй роли.</span>
        </div>
      )}
      {selected && (
        <label class="toggle">
          <input type="checkbox" checked={writable} onChange={e => setWritable(selected, e.currentTarget.checked)} />
          <span class="toggle__track" />
          <span>
            Разрешить запись в этот плейлист
            <small>{writable ? 'Приложение может перемещать, добавлять и удалять элементы после вашего подтверждения.' : 'Сейчас только чтение: приложение показывает планы, но ничего не меняет.'}</small>
          </span>
        </label>
      )}
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
      <div class="note">
        <Icon name="warning" size={18} />
        <span>
          Для первой проверки записи создайте отдельный тестовый плейлист (15–20 треков и клипов вперемешку), выберите его вместо настоящего и разрешите запись только ему. Порядок сортировки плейлиста на YouTube должен быть «Вручную».
        </span>
      </div>
      <button class="btn btn--text" onClick={loadMyPlaylists}>
        <Icon name="refresh" size={18} />
        Обновить список плейлистов
      </button>
      <div class="haptics-check" data-no-haptic>
        <span class="muted small">Тактильный отклик: {HAPTICS_LABEL[hapticsSupport()]}. Проверьте, какой способ даёт тик:</span>
        <div class="haptics-check__row">
          <button class="btn btn--outline btn--small" onClick={haptic}>
            Способ 1
          </button>
          <label class="btn btn--outline btn--small haptics-check__label">
            Способ 2
            <input type="checkbox" {...{ switch: true }} class="haptics-check__hidden" aria-hidden="true" tabIndex={-1} />
          </label>
          <label class="haptics-check__native">
            <input type="checkbox" {...{ switch: true }} />
            Способ 3
          </label>
        </div>
      </div>
      <p class="muted small">Версия {__APP_VERSION__}</p>
    </Dialog>
  )
}
