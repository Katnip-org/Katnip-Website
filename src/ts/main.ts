import { mount } from 'svelte'
import App from "../svelte/App.svelte";
import { restoreProjects } from "./projects.svelte";

await restoreProjects();

const app = mount(App, {
    target: document.getElementById('root')!,
})

export default app
