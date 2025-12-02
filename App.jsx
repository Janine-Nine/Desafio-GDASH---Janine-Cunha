import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import PokemonCard from './components/PokemonCard'
import './App.css'

export default function App() {
  const [pokemonList, setPokemonList] = useState([])
  const [filteredList, setFilteredList] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPokemon()
  }, [])

  const fetchPokemon = async () => {
    try {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20')
      const data = await response.json()
      
      const pokemonDetails = await Promise.all(
        data.results.map(async (pokemon) => {
          const res = await fetch(pokemon.url)
          return res.json()
        })
      )
      
      setPokemonList(pokemonDetails)
      setFilteredList(pokemonDetails)
    } catch (error) {
      console.error('Erro ao buscar Pokémon:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    const filtered = pokemonList.filter(pokemon =>
      pokemon.name.toLowerCase().includes(term.toLowerCase())
    )
    setFilteredList(filtered)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 via-yellow-400 to-red-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">Pokédex</h1>
          <p className="text-white text-lg drop-shadow">Explore todos os Pokémon</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-md mx-auto">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar Pokémon..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-white bg-white/90 focus:outline-none focus:border-yellow-300"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-white text-xl">Carregando Pokémon...</div>
        )}

        {/* Pokemon Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredList.map((pokemon) => (
              <PokemonCard key={pokemon.id} pokemon={pokemon} />
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && filteredList.length === 0 && (
          <div className="text-center text-white text-xl">
            Nenhum Pokémon encontrado
          </div>
        )}

        {/* Load More Button */}
        {!loading && (
          <div className="text-center mt-12">
            <button
              onClick={fetchPokemon}
              className="bg-white text-red-500 px-8 py-3 rounded-lg font-bold hover:bg-yellow-300 transition-colors"
            >
              Carregar Mais
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
