# Elevator UI

> Frontend for [Elevator App](https://github.com/UMN-LATIS/elevator), a multi-asset digital repository.

This project contains the updated [Vue 3](https://vuejs.org/) UI for Elevator.

## Getting Started

To get started with local development, you'll need a few prerequisites:

- NodeJS LTS
- Elevator App (backend) like <https://dev.elevator.umn.edu>
- [ArcGIS API Key](https://developers.arcgis.com) for map functionality

1. Clone the repository

   ```sh
   $ git clone https://github.com/UMN-LATIS/elevator-ui

   $ cd elevator-ui
   ```

2. Copy `.env.example` to `.env` and update the values as needed:

   - **`BASE_ORIGIN`** - the URL of the Elevator App backend. For local development the backend will be proxied, so use `/api`.
   - **`VITE_API_PROXY_TARGET`** - the URL of the Elevator App backend used for local development (e.g. `https://dev.elevator.umn.edu`).
   - **`BASE_PATH`** - the path to the instance of Elevator on the origin (e.g. `/dcl` or `/defaultinstance`).
   - **`ARCGIS_API_KEY`** - the [ArcGIS](https://developers.arcgis.com) API Key for the map functionality.

3. Install dependencies

   ```sh
   $ yarn install
   ```

4. Start the development server

   ```sh
   $ yarn dev
   ```

5. Open <http://localhost:5173> in your browser

### Storybook

Elevator uses Storybook for component development. To see the component library, run:

```sh
$ yarn storybook
```

## Development

This UI uses [StorybookJS](https://storybook.js.org/) for component development, to see the stories run:

```sh
$ yarn storybook
```

## Deployment

This UI is deployed to the Elevator App backend as a static site.

To build the static site:

```sh
# SSH into the Elevator App backend
$ ssh <username>@<hostname>

# Navigate to the Elevator UI directory
$ cd /opt/elevator/assets

# Clone the repository (if not already cloned)
$ git clone https://github.com/UMN-LATIS/elevator-ui

# Navigate to the Elevator UI directory
$ cd elevator-ui

# build any dependencies
$ yarn install

# build the static site
# this will build the site in the `dist` directory, and set the base path to `/assets/elevator-ui/dist`
$ yarn build:remotedev
```

### About Environment Variables in Production

In production, there's no need to configure a `.env` file. The UI will get the configuration variables from `window.Elevator.config`, which the [`VueTemplate.php`](https://github.com/UMN-LATIS/elevator/blob/develop/application/views/vueTemplate.php) will populate. See [`src/config.ts`](src/config.ts).

## Contact

Email: elevator@umn.edu

```

```
