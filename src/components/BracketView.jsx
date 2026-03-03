import { useTheme } from '../context/ThemeContext'
import Avatar from './Avatar'

function MatchCard({ match, students, canEdit, onSelectWinner, dark }) {
  const s1 = students.find(s => s.id === match.s1)
  const s2 = students.find(s => s.id === match.s2)
  const isBye = !match.s1 || !match.s2

  if (isBye && match.winner) return null // Don't render bye matches

  const PlayerSlot = ({ student, studentId, isWinner, isTop }) => {
    const active = canEdit && match.s1 && match.s2 && !match.winner
    return (
      <button
        onClick={() => active && onSelectWinner(studentId)}
        disabled={!active}
        className={`
          flex items-center gap-2 px-3 py-2.5 w-full text-left transition-all
          ${isTop ? 'rounded-t-xl' : 'rounded-b-xl'}
          ${isWinner ? 'bg-accent/20 border-accent' : ''}
          ${active ? 'press-scale cursor-pointer' : ''}
          ${dark ? 'hover:bg-white/[0.06]' : 'hover:bg-black/[0.04]'}
        `}
      >
        {student ? (
          <>
            <Avatar name={student.name} size={28} src={student.avatar} />
            <span className={`text-xs font-semibold truncate flex-1 ${isWinner ? 'text-accent' : ''}`}>
              {student.name}
            </span>
            {student.weight && (
              <span className={`text-[10px] ${dark ? 'text-white/30' : 'text-gray-400'}`}>{student.weight}кг</span>
            )}
          </>
        ) : (
          <span className={`text-xs italic ${dark ? 'text-white/20' : 'text-gray-300'}`}>Ожидание...</span>
        )}
      </button>
    )
  }

  return (
    <div className={`
      rounded-xl overflow-hidden border min-w-[160px]
      ${dark ? 'bg-white/[0.04] border-white/[0.08] backdrop-blur-xl' : 'bg-white/70 border-white/60 shadow-sm'}
      ${match.winner ? 'opacity-90' : ''}
    `}>
      <PlayerSlot student={s1} studentId={match.s1} isWinner={match.winner === match.s1} isTop />
      <div className={`h-px ${dark ? 'bg-white/[0.08]' : 'bg-black/[0.06]'}`} />
      <PlayerSlot student={s2} studentId={match.s2} isWinner={match.winner === match.s2} isTop={false} />
    </div>
  )
}

export default function BracketView({ brackets, students, canEdit, onSelectWinner }) {
  const { dark } = useTheme()
  if (!brackets?.rounds?.length) return null

  const roundNames = (numRounds) => {
    const names = []
    for (let i = 0; i < numRounds; i++) {
      if (i === numRounds - 1) names.push('Финал')
      else if (i === numRounds - 2) names.push('Полуфинал')
      else if (i === numRounds - 3) names.push('1/4 финала')
      else names.push(`Раунд ${i + 1}`)
    }
    return names
  }

  // Filter out rounds where all matches are byes
  const visibleRounds = brackets.rounds.map((round, ri) => ({
    matches: round.filter(m => !((!m.s1 || !m.s2) && m.winner)),
    index: ri,
  })).filter(r => r.matches.length > 0)

  const names = roundNames(brackets.rounds.length)

  return (
    <div className="overflow-x-auto pb-4 -mx-4 px-4">
      <div className="flex gap-4" style={{ minWidth: visibleRounds.length * 184 }}>
        {visibleRounds.map(({ matches, index }) => (
          <div key={index} className="flex flex-col gap-3 min-w-[176px]">
            <div className={`text-[10px] uppercase font-bold text-center tracking-wider mb-1 ${dark ? 'text-white/30' : 'text-gray-400'}`}>
              {names[index]}
            </div>
            <div className="flex flex-col justify-around flex-1 gap-3">
              {matches.map((match, mi) => (
                <MatchCard
                  key={`${index}-${mi}`}
                  match={match}
                  students={students}
                  canEdit={canEdit}
                  onSelectWinner={(winnerId) => onSelectWinner(index, brackets.rounds[index].indexOf(match), winnerId)}
                  dark={dark}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
