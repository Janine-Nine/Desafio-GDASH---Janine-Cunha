export default function PokemonCard({ pokemon }) {
  const typeColors = {
    fire: 'bg-red-500',
    water: 'bg-blue-500',
    grass: 'bg-green-500',
    electric: 'bg-yellow-500',
    ice: 'bg-cyan-400',
    fighting: 'bg-orange-700',
    poison: 'bg-purple-500',
    ground: 'bg-amber-600',
    flying: 'bg-sky-400',
    psychic: 'bg-pink-500',
    bug: 'bg-lime-500',
    rock: 'bg-gray-600',
    ghost: 'bg-indigo-600',
    dragon: 'bg-indigo-500',
    dark: 'bg-gray-800',
    steel: 'bg-slate-400',
    fairy: 'bg-pink-400',
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
      {/* Image */}
      <div className="bg-gradient-to-br from-gray-100 to-gray-200 p-4 flex justify-center items-center h-48">
        <img
          src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default}
          alt={pokemon.name}
          className="h-40 w-40 object-contain"
        />
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-lg capitalize text-gray-800 mb-2">
          {pokemon.name}
        </h3>

        {/* ID */}
        <p className="text-gray-500 text-sm mb-3">#{String(pokemon.id).padStart(3, '0')}</p>

        {/* Types */}
        <div className="flex gap-2 flex-wrap mb-3">
          {pokemon.types.map((type) => (
            <span
              key={type.type.name}
              className={`${
                typeColors[type.type.name] || 'bg-gray-400'
              } text-white text-xs font-bold px-3 py-1 rounded-full capitalize`}
            >
              {type.type.name}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-600">
          <p>
            <span className="font-semibold">Altura:</span> {pokemon.height / 10}m
          </p>
          <p>
            <span className="font-semibold">Peso:</span> {pokemon.weight / 10}kg
          </p>
        </div>
      </div>
    </div>
  )
}
