// Sends a receipt to a member when they return a book. In real life this calls an email service over the network,
// so it can fail. Here it fails for addresses at bounce.example, the way a real provider rejects a dead mailbox.
// Do not change this file.
export async function sendReturnReceipt(member, loan) {
	await new Promise((resolve) => setTimeout(resolve, 5));
	if (member.email.endsWith('@bounce.example')) {
		throw new Error(`Receipt for loan ${loan.id} bounced: mailbox ${member.email} does not exist`);
	}
}
