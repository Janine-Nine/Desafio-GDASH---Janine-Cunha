import { Layout } from "@/components/Layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

interface Pokemon {
  name: string;
  url: string;
}

interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other: {
      'official-artwork': {
        front_default: string;
      }
    }
  };
  types: {
    type: {
      name: string;
    }
  }[];
  stats: {
    base_stat: number;
    stat: {
      name: string;
    }
  }[];
}

const fetchPokemons = async (page: number) => {
  const offset = (page - 1) * 20;
  const response = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=20`);
  return response.json();
};

const fetchPokemonDetail = async (url: string) => {
  const response = await fetch(url);
  return response.json();
};

function PokemonCard({ url }: { url: string }) {
  const { data: pokemon, isLoading } = useQuery<PokemonDetail>({
    queryKey: ['pokemon', url],
    queryFn: () => fetchPokemonDetail(url),
  });

  if (isLoading) {
    return <Skeleton className="h-[250px] w-full rounded-xl" />;
  }

  if (!pokemon) return null;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow group">
      <CardContent className="p-4">
        <div className="relative aspect-square bg-muted/30 rounded-lg mb-4 flex items-center justify-center group-hover:bg-muted/50 transition-colors">
          <img 
            src={pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default} 
            alt={pokemon.name}
            className="w-3/4 h-3/4 object-contain drop-shadow-lg transition-transform group-hover:scale-110 duration-300"
          />
          <Badge variant="secondary" className="absolute top-2 right-2 text-xs font-mono">
            #{pokemon.id.toString().padStart(3, '0')}
          </Badge>
        </div>
        <h3 className="text-lg font-bold capitalize mb-2">{pokemon.name}</h3>
        <div className="flex flex-wrap gap-2">
          {pokemon.types.map((t) => (
            <Badge key={t.type.name} variant="outline" className="capitalize text-xs">
              {t.type.name}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Explore() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pokemons', page],
    queryFn: () => fetchPokemons(page),
    placeholderData: (previousData) => previousData,
  });

  return (
    <Layout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Explore API</h1>
            <p className="text-muted-foreground">External API Integration Demo (PokéAPI)</p>
          </div>
          
          <div className="flex items-center gap-2">
             <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search Pokémon..." className="pl-8" />
            </div>
          </div>
        </div>

        {isError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6 text-center text-destructive">
              Failed to load data from external API.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
                  ))
                : data?.results.map((p: Pokemon) => (
                    <PokemonCard key={p.name} url={p.url} />
                  ))}
            </div>

            <div className="flex items-center justify-between py-4">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data?.next || isLoading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
