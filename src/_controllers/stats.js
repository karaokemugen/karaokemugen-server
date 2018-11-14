export default function statsController(router) {
	router.post('/stats', async (req, res) => {
		try {
			res.status(200).send('Stats payload accepted');
		} catch(err) {
			res.status(500).send(`Error while processing stats payload : ${err}`);
		}
	});
}