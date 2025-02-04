export const toID = (a: number) => `${a.toString(16).padStart(8, '0').slice(0, 4)}-${a.toString(16).padStart(8, '0').slice(4, 8)}`;

export const repackDict = (r: any) => JSON.parse(JSON.stringify(r));

export function constructBody(s: string) {
    return {
        method:'POST',
        body:JSON.stringify({
            'id':s
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
};
