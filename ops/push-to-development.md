# Pushing changes to the `development` branch

Follow these steps to move your current work onto the `development` branch and publish it remotely:

1. **Ensure your working tree is clean and tests are passing.**
   ```bash
   git status -sb
   ```
2. **Create or reset the local `development` branch based on the current branch (e.g., `work`).**
   ```bash
   git checkout -B development
   ```
3. **Push the branch to the remote `development`.**
   ```bash
   git push -u origin development
   ```
4. **(Optional) Open a pull request targeting `development`** if your workflow requires code review instead of direct pushes.

If you prefer to keep working on `work` and only update `development` periodically, you can merge or rebase:

```bash
git checkout development
git merge work   # or: git rebase work
```

Then repeat step 3 to push.
