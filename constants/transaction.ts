export type Transaction = {
    id: number,
    species: string,
    origin: Source,
    destination: Source,
    state: string,
    timestamp: number
};

export type Source = {
    type: string,
    id: number
};