const { read, write } = require('./io');
const { dt, generateId } = require('../utils/helper');

const { verifyUPI, validatePattern } = require('bhimupijs');

module.exports.verifyUpiId = async (req, res) => {
  try {
    const { vpa } = req.query;

    if (!vpa) throw new Error('No VPA provided');

    const { isQueryPatternValid } = validatePattern(vpa);
    if (!isQueryPatternValid) throw new Error('Invalid VPA pattern');

    const { tpap, pspBank, isVpaVerified, payeeAccountName } = await verifyUPI(
      vpa
    );

    if (!isVpaVerified) throw new Error('Invalid VPA');

    res.send({
      vpa,
      bank: pspBank,
      provider: tpap,
      isVerified: isVpaVerified,
      accountName: payeeAccountName,
    });
  } catch (e) {
    res.status(401).send({ message: e.message });
  }
};

module.exports.createLifafa = (req, res) => {
  try {
    const createdBy = req.body.createdBy || 'Anonymous';

    const count = Number(req.body.count);
    if (isNaN(count) || count < 1) throw new Error('Invalid lifafa count');

    const amount = Number(req.body.amount);
    if (isNaN(amount) || amount < 1) throw new Error('Invalid amount');

    const lifafaId = generateId();

    const allLifafas = read() || {};
    allLifafas[lifafaId] = {
      count,
      lifafaId,
      createdBy,
      claimedBy: [],
      remaining: count,
      initialAmount: amount,
      remainingAmount: amount,
      createdAt: dt(),
    };
    write(allLifafas);

    res.send({ ...allLifafas[lifafaId] });
  } catch (e) {
    res.status(404).send({ message: e.message });
  }
};

module.exports.claimLifafa = (req, res) => {
  try {
    const { upiId, lifafaId, accountName } = req.body;

    const allLifafas = read() || {};
    const lifafa = allLifafas[lifafaId];

    if (!lifafa) throw new Error('Invalid Lifafa');
    if (lifafa?.remaining <= 0) throw new Error('All lifafas claimed');

    if (!lifafa.remaining) lifafa.remaining = lifafa.count;
    if (!lifafa.claimedBy) lifafa.claimedBy = [];

    const alreadyClaimed = lifafa.claimedBy.some((el) => el.upiId === upiId);
    if (alreadyClaimed) throw new Error('Already claimed');

    const MAX_DEVIATION = 30;
    const randomPercent = Math.floor(Math.random() * 2 * MAX_DEVIATION);

    const idealAmount = lifafa.remainingAmount / lifafa.remaining;
    const deviatedAmount = (idealAmount * randomPercent) / 200.0;

    let claimedAmount =
      lifafa.remaining === 1
        ? lifafa.remainingAmount
        : randomPercent < MAX_DEVIATION
        ? idealAmount + deviatedAmount
        : idealAmount - deviatedAmount;
    claimedAmount = parseFloat(claimedAmount.toFixed(2));

    lifafa.remainingAmount = parseFloat(
      (lifafa.remainingAmount - claimedAmount).toFixed(2)
    );
    lifafa.remaining = lifafa.remaining - 1;
    lifafa.claimedBy.push({
      upiId,
      accountName,
      claimedAmount,
      claimedAt: dt(),
    });

    allLifafas[lifafaId] = lifafa;
    write(allLifafas);

    res.send({ claimedAmount, ...allLifafas[lifafaId] });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
};

module.exports.getLifafa = (req, res) => {
  try {
    const { lifafaId } = req.params;

    const allLifafas = read() || {};

    const lifafa = allLifafas[lifafaId];
    if (!lifafa) throw new Error('Invalid Lifafa');

    if (lifafa.remaining > 0) return res.send(lifafa);

    res.send({
      count: lifafa.count,
      createdAt: lifafa.createdAt,
      createdBy: lifafa.createdBy,
      initialAmount: lifafa.initialAmount,
      message: 'All lifafas already claimed',
    });
  } catch (e) {
    res.status(404).send({ message: e.message });
  }
};

module.exports.getAllLifafa = (req, res) => {
  const allLifafas = read() || {};
  res.send(allLifafas);
};
