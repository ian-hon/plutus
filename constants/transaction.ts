export type Transaction = {
    id: number,
    balance: number,
    origin: Source,
    destination: Source,
    state: string,
    timestamp: number
};

export function parseTransaction(t: any): Transaction {
    return {
        id: t['id'],
        balance: t['balance'],
        origin: {
            type: Object.keys(t['origin'])[0],
            id: t['origin'][Object.keys(t['origin'])[0]]
        },
        destination: {
            type: Object.keys(t['destination'])[0],
            id: t['destination'][Object.keys(t['destination'])[0]]
        },
        state: t['state'],
        timestamp: t['timestamp']
    }
}

export type Source = {
    type: string,
    id: number
};