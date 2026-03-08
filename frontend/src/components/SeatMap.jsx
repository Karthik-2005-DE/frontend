export default function SeatMap({ selectedSeats, setSelectedSeats }) {
  const rows = 8
  const cols = 10

  const toggleSeat = (seat) => {
    if (selectedSeats.includes(seat)) {
      setSelectedSeats(selectedSeats.filter((selectedSeat) => selectedSeat !== seat))
      return
    }

    setSelectedSeats([...selectedSeats, seat])
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {Array.from({ length: rows }).map((_, row) => (
        <div key={row} className="flex gap-2">
          {Array.from({ length: cols }).map((_, col) => {
            const seat = `${row + 1}-${col + 1}`
            const selected = selectedSeats.includes(seat)

            return (
              <div
                key={seat}
                onClick={() => toggleSeat(seat)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded text-xs ${
                  selected ? "bg-purple-600 text-white" : "bg-gray-300 dark:bg-gray-700"
                }`}
              >
                {col + 1}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
