# Setting Up a Chrome Extension from Unpacked

Follow these steps to set up a Chrome extension from an unpacked directory:

1. **Download the Extension Files:**
  Download the extension files from the provided source or repository. Ensure the downloaded folder contains all the necessary files for the Chrome extension, including `manifest.json`, HTML, CSS, and JavaScript files. You can clone the repository using the following command:
  ```sh
  git clone <your-git-repo-url>
  ```

2. **Change API Key:**
  After cloning the source, change the `API_KEY` in `scripts/content.js` with your API key generated from [Google AI Studio](https://aistudio.google.com/).

3. **Open Chrome Extensions Page:**
  Open Google Chrome and navigate to `chrome://extensions/`.

4. **Enable Developer Mode:**
  In the top right corner, toggle the "Developer mode" switch to enable it.

5. **Load Unpacked Extension:**
  Click the "Load unpacked" button and select the directory containing the downloaded extension files.

By following these steps, you can successfully set up and test your Chrome extension from an unpacked directory.

## Contributing

We welcome contributions to improve this Chrome extension. If you have suggestions, bug reports, or would like to contribute code, please follow these steps:

1. **Fork the Repository:**
  Click the "Fork" button at the top right corner of the repository page to create a copy of the repository in your GitHub account.

2. **Clone Your Fork:**
  Clone the forked repository to your local machine using the following command:
  ```sh
  git clone <your-forked-repo-url>
  ```

3. **Create a Branch:**
  Create a new branch for your changes:
  ```sh
  git checkout -b my-feature-branch
  ```

4. **Make Changes:**
  Make your changes to the codebase. Ensure your code follows the project's coding standards and includes appropriate tests.

5. **Commit and Push:**
  Commit your changes and push them to your forked repository:
  ```sh
  git add .
  git commit -m "Description of your changes"
  git push origin my-feature-branch
  ```

6. **Create a Pull Request:**
  Open a pull request from your branch to the main repository. Provide a clear description of your changes and any relevant information.

Thank you for your contributions!