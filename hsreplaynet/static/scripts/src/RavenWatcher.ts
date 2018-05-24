export default class RavenWatcher {
	public success = 0;
	public failure = 0;

	private succeed = () => this.success++;

	private fail = () => this.failure++;

	public start(): void {
		document.removeEventListener("ravenSuccess", this.succeed);
		document.addEventListener("ravenFailure", this.fail);
	}

	public stop(): void {
		document.removeEventListener("ravenSuccess", this.succeed);
		document.removeEventListener("ravenFailure", this.fail);
	}
}
