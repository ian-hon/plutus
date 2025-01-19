export default function TestElement({ n }: { n: string }): React.JSX.Element {
    console.log(`${Date.now()} ${n} triggered`);
    return <></>
}