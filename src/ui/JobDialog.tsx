import { COST_WRITE } from '../config'
import { dismissJob, forgetInterrupted, interrupted, job, stopJob, type JobState } from '../state/job'
import { refreshAll, refreshRole } from '../state/playlists'
import { msUntilPacificMidnight } from '../state/quota'
import { Dialog } from './Dialog'
import { duration, num } from './format'
import { Icon } from './icons'
import { dialog, ROLE_LABEL } from './ui'

function jobTitle(j: JobState): string {
  return j.kind === 'sort' ? `Сортировка: ${ROLE_LABEL[j.roles[0]!]}` : 'Перенос между плейлистами'
}

export async function resume(j: JobState): Promise<void> {
  forgetInterrupted()
  job.value = null
  if (j.kind === 'sort') {
    await refreshRole(j.roles[0]!)
    dialog.value = { type: 'plan', role: j.roles[0]! }
  } else {
    await refreshAll()
    dialog.value = { type: 'transfer' }
  }
}

export function JobDialog() {
  const j = job.value
  if (!j) return null
  const pct = j.total > 0 ? Math.round((j.done / j.total) * 100) : 100
  const finished = j.phase === 'done' || j.phase === 'stopped' || j.phase === 'failed'
  const close = () => (j.phase === 'done' ? (job.value = null) : dismissJob())
  return (
    <Dialog
      title={jobTitle(j)}
      onClose={finished ? close : undefined}
      footer={
        finished ? (
          <>
            <button class="btn btn--ghost" onClick={close}>
              {j.phase === 'done' ? 'Готово' : 'Продолжить позже'}
            </button>
            {j.phase !== 'done' && !j.quota && (
              <button class="btn btn--primary" onClick={() => resume(j)}>
                Продолжить сейчас
              </button>
            )}
          </>
        ) : (
          <button class="btn btn--ghost" disabled={j.phase === 'stopping'} onClick={stopJob}>
            {j.phase === 'stopping' ? 'Останавливаю…' : 'Остановить'}
          </button>
        )
      }
    >
      <div class="progress">
        <div class="progress__bar">
          <div class={`progress__fill progress__fill--${j.phase}`} style={{ width: `${pct}%` }} />
        </div>
        <div class="progress__meta">
          <span>
            {num(j.done)} из {num(j.total)}
          </span>
          <span>{pct}%</span>
        </div>
      </div>
      {j.current && !finished && <p class="progress__current">{j.current}</p>}
      <p class="muted small">Потрачено квоты: {num(j.done * COST_WRITE)} ед.</p>
      {j.phase === 'running' && <p class="muted small">Не закрывайте вкладку до завершения. Если закрыть — выполненные шаги сохранятся, остальное можно будет продолжить.</p>}
      {j.phase === 'done' && (
        <div class="alert alert--ok">
          <Icon name="check" size={18} />
          <span>Готово. Плейлист перезагружен с сервера.</span>
        </div>
      )}
      {j.phase === 'stopped' && (
        <div class="alert alert--warn">
          <Icon name="warning" size={18} />
          <span>{j.error ?? 'Остановлено.'} При продолжении плейлист будет загружен заново и план пересчитан.</span>
        </div>
      )}
      {j.phase === 'failed' && (
        <div class="alert alert--error">
          <Icon name="warning" size={18} />
          <span>
            {j.error}
            {j.quota && ` До сброса квоты примерно ${duration(msUntilPacificMidnight())}.`} При продолжении плейлист будет загружен заново и план пересчитан.
          </span>
        </div>
      )}
    </Dialog>
  )
}

export function InterruptedBanner() {
  const j = interrupted.value
  if (!j || job.value) return null
  return (
    <div class="banner">
      <Icon name="warning" size={20} />
      <span>
        {j.kind === 'sort' ? `Сортировка «${ROLE_LABEL[j.roles[0]!]}» прервана` : 'Перенос между плейлистами прерван'}: выполнено {num(j.done)} из {num(j.total)}.{j.error ? ` ${j.error}` : ''}
      </span>
      <button class="btn btn--small btn--primary" onClick={() => resume(j)}>
        Продолжить
      </button>
      <button class="icon-btn" title="Скрыть" aria-label="Скрыть" onClick={forgetInterrupted}>
        <Icon name="close" size={20} />
      </button>
    </div>
  )
}
