export enum Outcome {
    Success,
    Data,
    Unspecified,

    Account,
    Limit,
    Session,
    AutoTransfer,
    User,

    Plutus,
}

export enum Account {
    NoExist,
    NoPermission,

    InsufficientBalance,
}

export enum Limit {
    LimitAlreadyExists,
    LimitDoesntExist,

    SurpassedLimit,
    WillSurpassLimit
}

export enum Session {
    SessionIDNoExist,
    SessionIDExpired,
    SessionIDInvalid
}

export enum AutoTransfer {
    AutoTransferDoesntExist,

    ToDoesntExist,
    FromDoesntExist,

    TargetSame, // when to and from are the same

    InsufficientBalance
}

export enum User {
    Success,

    // login
    PasswordWrong,
    UsernameNoExist,

    // signup
    UsernameExist
}

export function getSpecies(s: any) {
    return Object.keys(s)[0];
}

export function getValue(s: any): string {
    return Object.values(s)[0] as string;
}
