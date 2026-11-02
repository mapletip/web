/** One documented color: its role label, CSS custom property and value. */
export type ColorRole = [label: string, token: string, color: string];

export type ColorGroup = { title: string; roles: ColorRole[] };
