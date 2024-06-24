import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import { Form, Link, redirect, useLoaderData } from "@remix-run/react";
import { BASE_URL } from "~/constants";

import type { MetaFunction } from "@vercel/remix";

// Define the response type
type BreedResponse = string[];

interface SearchResponse {
  next?: string;
  prev?: string;
  resultIds?: string[]; // dont need an entirely new type, since i just remove the results when leaving loader.
  total: number;
}

interface ResultResponse {
  img: string;
  name: string;
  age: number;
  breed: string;
  zip_code: string;
  id: string;
}

interface SearchParams {
  sort: string;
  size: number;
  from: number;
  selectedBreeds: (string | undefined)[];
  close: boolean;
}

interface LoaderData {
  breeds: BreedResponse;
  search: SearchResponse;
  dogs: ResultResponse[];
  params: SearchParams;
}

const getBreedsFromParams = (params: URLSearchParams): string[] => {
  let breeds: string[] = [];

  // Handle array notation (e.g., breeds[0], breeds[1], etc.)
  params.forEach((value, key) => {
    const match = key.match(/^breeds\[\d+\]$/);
    if (match) {
      breeds.push(value);
    }
  });

  // Handle simple notation (e.g., breeds=Basset&breeds=Cairn)
  const simpleBreeds = params.getAll("breeds");
  if (simpleBreeds.length > 0) {
    breeds = breeds.concat(simpleBreeds);
  }

  return breeds;
};

//#region Meta
export const meta: MetaFunction = () => {
  return [{ title: "Doggy Dream Home | Search" }];
};
//#endregion

//#region Loader
// Loader function to fetch breed names
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  const cookies = request.headers.get("Cookie")?.toString() || "";

  // #region Breeds API
  const breedsApiEndpoint = BASE_URL + "/dogs/breeds";

  const breedsResponse = await fetch(breedsApiEndpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies?.toString() || "",
    },
    credentials: "include",
  });

  if (!breedsResponse.ok) {
    throw new Response("Failed to fetch breed names", {
      status: breedsResponse.status,
    });
  }

  const breedsData: BreedResponse = await breedsResponse.json();
  //#endregion

  //#region Search API
  const sort = searchParams.get("sort") ?? "breed:asc";
  const size = searchParams.get("size") ?? "20";
  const from = searchParams.get("from");
  const breeds = getBreedsFromParams(searchParams);

  const close = Boolean(searchParams.get("close"));

  const knownBreedsMap = new Map(
    breedsData.map((breed) => [breed.toLowerCase(), breed]),
  );

  // Filter and map breeds to their correct casing
  const validBreeds = breeds
    .map((breed) => knownBreedsMap.get(breed.toLowerCase()))
    .filter(Boolean)
    .sort();

  const params = {
    sort,
    size: Number(size),
    from: Number(from),
    selectedBreeds: breeds,
    close,
  };

  const query = [
    sort && `sort=${sort}`,
    size && `size=${size}`,
    from && `from=${from}`,
    validBreeds && validBreeds.map((breed) => `breeds=${breed}`).join("&"),
  ]
    .filter(Boolean)
    .join("&");

  const searchApiEndpoint = BASE_URL + "/dogs/search" + `?${query}`; // ! TODO add query params feature later

  const searchResponse = await fetch(searchApiEndpoint, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies?.toString() || "",
    },
    credentials: "include",
  });

  if (!searchResponse.ok) {
    throw new Response("Failed to fetch breed names", {
      status: searchResponse.status,
    });
  }

  const searchData: SearchResponse = await searchResponse.json();

  const searchLoaderData = {
    total: searchData.total,
    resultIds: undefined,
    next: searchData.next?.substring(5) ?? undefined,
    prev: searchData.prev?.substring(5) ?? undefined,
  };
  const searchResults = searchData.resultIds;
  //#endregion

  //#region Result API
  const resultApiEndpoint = BASE_URL + "/dogs";

  const resultResponse = await fetch(resultApiEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies?.toString() || "",
    },
    credentials: "include",
    body: JSON.stringify(searchResults),
  });

  if (!resultResponse.ok) {
    return json({ error: "Failed to submit form data" }, { status: 500 });
  }

  const resultData: ResultResponse[] = await resultResponse.json();
  //#endregion

  const loaderData: LoaderData = {
    breeds: breedsData,
    search: searchLoaderData,
    dogs: resultData,
    params,
  };

  return json(loaderData);
};
//#endregion

//#region Action
export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();

  const intent = formData.get("intent");

  // handle reset of search
  if (intent === "delete") {
    const redirectUrl = `/search`;
    return redirect(redirectUrl);
  }

  const selectedBreeds = Array.from(formData.entries()).map(
    (select) => select[0],
  );

  const query = selectedBreeds
    .map((breed) => {
      if (breed === "intent") return null;
      const decode = breed.split("_").join(" ");

      return `breeds=${decode}`;
    })
    .filter(Boolean)
    .join("&");

  const redirectUrl = `/search?${query}`;
  return redirect(redirectUrl);

  // return null;
};
//#endregion

//#region Component
const Search = () => {
  const { breeds, search, dogs, params } = useLoaderData<LoaderData>();

  const handleCloseDetail = () => {
    document.getElementById("details")?.removeAttribute("open");
  };

  return (
    <div className="flex min-h-lvh flex-col whitespace-break-spaces bg-white">
      <Form method="POST" className="max-h-lvh">
        <details
          id="details"
          className="sticky top-0 z-10 flex h-full w-full flex-col border-b bg-white drop-shadow-sm"
        >
          <summary className="sticky top-0 border-b bg-white p-2 text-lg">
            <h1 className="inline">Dog Breeds</h1>
            {params.selectedBreeds.length > 0 ? (
              <span className="font-semibold">{`: ${params.selectedBreeds.length} Selected`}</span>
            ) : (
              ""
            )}
          </summary>
          <ul className="flex flex-grow-0 flex-wrap gap-2 p-2 shadow-inner">
            {breeds?.map((breed, index) => (
              <li key={index} className="rounded border px-2 py-1">
                <label className="flex gap-2">
                  <input
                    defaultChecked={
                      params.selectedBreeds?.includes(breed) ?? false
                    }
                    type="checkbox"
                    name={breed.split(" ").join("_")}
                    id={breed.split(" ").join("_")}
                  />
                  {breed}
                </label>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-0 flex flex-row-reverse gap-2 border-t bg-white p-2">
            <button
              type="submit"
              name="intent"
              value="submit"
              className="rounded border border-green-600 bg-green-100 px-4 py-2 text-xl font-semibold drop-shadow hover:drop-shadow-md active:drop-shadow-sm"
              onClick={handleCloseDetail}
            >
              Search
            </button>

            <button
              type="submit"
              name="intent"
              value="delete"
              className="rounded border border-red-600 bg-red-100 px-4 py-2 text-xl font-semibold drop-shadow hover:drop-shadow-md active:drop-shadow-sm"
              onClick={handleCloseDetail}
            >
              Clear
            </button>
          </div>
        </details>
      </Form>
      <div className="flex h-full flex-grow flex-col justify-center px-2 py-4">
        <div className="grid w-full grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {dogs?.map((dog, index) => (
            <div key={dog.id} className="relative">
              <div className="absolute left-0 top-0 rounded-br-lg rounded-tl bg-gray-50 px-2 py-1">
                {params.from + index + 1}
              </div>
              <div className="h-30 aspect-square overflow-hidden rounded-md">
                <img
                  src={dog.img}
                  alt="A Pretty Puppy"
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="text-lg font-semibold">{dog.name}</h2>
              <h3 className="whitespace-pre-line text-gray-600">{dog.breed}</h3>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls and Info */}
      <div className="sticky bottom-1 grid w-full grid-cols-3 p-4 drop-shadow-lg">
        <div className="place-content-center justify-self-start">
          {search.prev && (
            <Link
              to={search.prev}
              className="place-content-start rounded border border-green-600 bg-green-100 px-4 py-2 text-xl font-semibold drop-shadow hover:drop-shadow-md active:drop-shadow-sm"
            >
              Prev
            </Link>
          )}
        </div>

        <div className="flex w-fit flex-col place-content-center items-center gap-1 justify-self-center rounded bg-white px-3 py-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{params.from + 1}</span>
            <span>-</span>
            <span className="text-lg font-semibold">
              {params.from + params.size}
            </span>
          </div>
          <span className="leading-4">{search.total}</span>
        </div>

        <div className="place-content-center justify-self-end">
          {search.next && (
            <Link
              to={search.next}
              className="rounded border border-green-600 bg-green-100 px-4 py-2 text-xl font-semibold drop-shadow hover:drop-shadow-md active:drop-shadow-sm"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
//#endregion

export default Search;
